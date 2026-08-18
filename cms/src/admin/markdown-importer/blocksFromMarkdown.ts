/**
 * Markdown -> Strapi 5 Blocks conversion.
 *
 * Uses `markdown-it` (the same parser Strapi ships with) to tokenize Markdown
 * and then walks the token stream to produce native Strapi 5 Blocks JSON.
 *
 * Safety:
 *  - `html: false` means raw HTML never becomes HTML; `html_block` /
 *    `html_inline` tokens are dropped entirely so no HTML can be smuggled
 *    into a Blocks document or its preview.
 *  - Link targets are sanitised to safe schemes (`http`, `https`, `mailto`,
 *    `tel`, relative URLs); anything else is rendered as plain text.
 *  - The importer never renders HTML itself; the preview renders the produced
 *    Blocks JSON through React (which escapes text).
 */

import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

import type {
  BlocksBlock,
  BlocksCodeBlock,
  BlocksHeadingBlock,
  BlocksInlineNode,
  BlocksLinkNode,
  BlocksListBlock,
  BlocksQuoteBlock,
  BlocksTextNode,
  BlocksValue,
} from './types';

const MARKDOWN_IT = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
});

const HEADING_LEVELS = new Set(['1', '2', '3', '4', '5', '6']);

/** Schemes/patterns considered safe for link targets. */
const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|#|\/|\.{0,2}\/)/i;

const MAX_LANGUAGE_LENGTH = 24;

/**
 * Returns a safe link URL, or `null` when the target uses an unsafe scheme.
 * Unsafe targets degrade to plain text instead of a link.
 */
export function sanitizeUrl(rawUrl: string): string | null {
  const url = rawUrl.trim();
  if (!url) return null;
  if (SAFE_URL_PATTERN.test(url)) return url;
  return null;
}

/**
 * Cleans a code-fence language hint (`js extra=foo` -> `js`) down to a short
 * safe identifier. Strapi stores it as free text, so we only need it to be
 * benign.
 */
export function sanitizeLanguage(rawInfo: string): string | undefined {
  const hint = rawInfo.trim().split(/\s+/)[0] ?? '';
  const clean = hint.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, MAX_LANGUAGE_LENGTH);
  return clean.length > 0 ? clean : undefined;
}

interface ActiveStyles {
  bold: boolean;
  italic: boolean;
  code: boolean;
  strikethrough: boolean;
}

const EMPTY_STYLES: ActiveStyles = {
  bold: false,
  italic: false,
  code: false,
  strikethrough: false,
};

function mergeStyles(stack: Partial<ActiveStyles>[]): ActiveStyles {
  return stack.reduce<ActiveStyles>(
    (acc, patch) => ({
      bold: acc.bold || patch.bold === true,
      italic: acc.italic || patch.italic === true,
      code: acc.code || patch.code === true,
      strikethrough: acc.strikethrough || patch.strikethrough === true,
    }),
    { ...EMPTY_STYLES },
  );
}

function textNode(text: string, styles: ActiveStyles, code = false): BlocksTextNode {
  const node: BlocksTextNode = { type: 'text', text };
  if (styles.bold) node.bold = true;
  if (styles.italic) node.italic = true;
  if (styles.code || code) node.code = true;
  if (styles.strikethrough) node.strikethrough = true;
  return node;
}

/**
 * Converts a markdown-it `inline` token (and its children) into Strapi inline
 * nodes (text with bold/italic/code/strikethrough, links). Raw HTML inline
 * tokens are ignored.
 */
function inlineTokenToNodes(token: Token): BlocksInlineNode[] {
  const nodes: BlocksInlineNode[] = [];
  let currentLink: BlocksLinkNode | null = null;

  const push = (node: BlocksTextNode) => {
    if (currentLink) {
      currentLink.children.push(node);
    } else {
      nodes.push(node);
    }
  };

  const stack: Partial<ActiveStyles>[] = [];
  const children = token.children ?? [];

  for (const child of children) {
    switch (child.type) {
      case 'text': {
        // markdown-it sometimes emits a leading empty text token; it carries
        // no content so it is safe (and cleaner) to skip it.
        if (child.content === '') break;
        push(textNode(child.content, mergeStyles(stack)));
        break;
      }
      case 'code_inline': {
        push(textNode(child.content, mergeStyles(stack), true));
        break;
      }
      case 'strong_open': {
        stack.push({ bold: true });
        break;
      }
      case 'strong_close': {
        stack.pop();
        break;
      }
      case 'em_open': {
        stack.push({ italic: true });
        break;
      }
      case 'em_close': {
        stack.pop();
        break;
      }
      case 's_open': {
        stack.push({ strikethrough: true });
        break;
      }
      case 's_close': {
        stack.pop();
        break;
      }
      case 'link_open': {
        if (currentLink) break; // ignore nested links
        const url = sanitizeUrl(child.attrGet('href') ?? '');
        if (!url) break; // unsafe URL -> keep the inner text as plain text
        currentLink = { type: 'link', url, rel: '', target: '', children: [] };
        nodes.push(currentLink);
        break;
      }
      case 'link_close': {
        if (currentLink && currentLink.children.length === 0) {
          // A link with no text renders as empty; give it an empty text child.
          currentLink.children.push({ type: 'text', text: '' });
        }
        currentLink = null;
        break;
      }
      case 'softbreak': {
        push(textNode(' ', mergeStyles(stack)));
        break;
      }
      case 'hardbreak': {
        push(textNode('\n', mergeStyles(stack)));
        break;
      }
      // html_inline, image, and other tokens are intentionally ignored.
      default:
        break;
    }
  }

  return nodes;
}

function isInline(token: Token | undefined): token is Token {
  return Boolean(token && token.type === 'inline');
}

/** Text node helper so an empty block still validates (min 1 child). */
function withFallbackChildren(nodes: BlocksInlineNode[]): BlocksInlineNode[] {
  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}

/** Flattens the inline content of a blockquote into a single quote block. */
function buildQuote(inlineTokens: Token[]): BlocksQuoteBlock {
  const nodes: BlocksInlineNode[] = [];
  for (const inlineToken of inlineTokens) {
    const inline = inlineTokenToNodes(inlineToken);
    if (inline.length > 0) {
      if (nodes.length > 0) nodes.push({ type: 'text', text: '\n' });
      nodes.push(...inline);
    }
  }
  return { type: 'quote', children: withFallbackChildren(nodes) };
}

interface ParsedBlock {
  block: BlocksBlock;
  nextIndex: number;
}

interface ParsedList {
  block: BlocksListBlock;
  nextIndex: number;
}

/**
 * Parses a list starting at `startIndex` (pointing at `bullet_list_open` or
 * `ordered_list_open`). Handles nested lists by emitting nested `ListBlockNode`
 * children with an incremented `indentLevel`, matching Strapi 5's list shape.
 */
function parseList(tokens: Token[], startIndex: number, indentLevel = 0): ParsedList {
  const openToken = tokens[startIndex];
  const format: BlocksListBlock['format'] =
    openToken.type === 'ordered_list_open' ? 'ordered' : 'unordered';

  const children: BlocksListBlock['children'] = [];
  let depth = 1;
  let i = startIndex + 1;

  while (i < tokens.length && depth > 0) {
    const token = tokens[i];

    if (token.type === 'list_item_open') {
      const item = parseListItem(tokens, i);
      children.push({ type: 'list-item', children: withFallbackChildren(item.nodes) });
      i = item.nextIndex;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const nested = parseList(tokens, i, indentLevel + 1);
      children.push(nested.block);
      i = nested.nextIndex;
      continue;
    }

    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
      depth -= 1;
      if (depth === 0) {
        const block: BlocksListBlock = { type: 'list', format, children };
        if (indentLevel > 0) block.indentLevel = indentLevel;
        return { block, nextIndex: i + 1 };
      }
    }

    i += 1;
  }

  return { block: { type: 'list', format, children }, nextIndex: i };
}

interface ParsedListItem {
  nodes: BlocksInlineNode[];
  nextIndex: number;
}

/**
 * Parses a single `list_item_open` ... `list_item_close` region. Nested lists
 * are NOT consumed here so the parent list parser can attach them as list
 * children (this mirrors Strapi's `(ListItem | List)[]` list shape).
 */
function parseListItem(tokens: Token[], itemStartIndex: number): ParsedListItem {
  const nodes: BlocksInlineNode[] = [];
  let depth = 1;
  let i = itemStartIndex + 1;

  while (i < tokens.length && depth > 0) {
    const token = tokens[i];

    if (token.type === 'list_item_open') {
      depth += 1;
      i += 1;
      continue;
    }

    if (token.type === 'list_item_close') {
      depth -= 1;
      if (depth === 0) return { nodes, nextIndex: i + 1 };
      i += 1;
      continue;
    }

    if (token.type === 'paragraph_open' && isInline(tokens[i + 1])) {
      const inline = inlineTokenToNodes(tokens[i + 1]);
      if (inline.length > 0) {
        if (nodes.length > 0) nodes.push({ type: 'text', text: '\n' });
        nodes.push(...inline);
      }
      i += 3;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      // Leave nested lists to the parent list parser.
      return { nodes, nextIndex: i };
    }

    i += 1;
  }

  return { nodes, nextIndex: i };
}

/** Parses a `blockquote_open` ... `blockquote_close` region into a quote block. */
function parseBlockquote(tokens: Token[], startIndex: number): ParsedBlock {
  const inlineTokens: Token[] = [];
  let depth = 1;
  let i = startIndex + 1;

  while (i < tokens.length && depth > 0) {
    const token = tokens[i];

    if (token.type === 'blockquote_open') {
      depth += 1;
      i += 1;
      continue;
    }

    if (token.type === 'blockquote_close') {
      depth -= 1;
      if (depth === 0) {
        return { block: buildQuote(inlineTokens), nextIndex: i + 1 };
      }
      i += 1;
      continue;
    }

    if (isInline(token)) inlineTokens.push(token);
    i += 1;
  }

  return { block: buildQuote(inlineTokens), nextIndex: i };
}

function headingBlock(token: Token, inlineToken: Token): BlocksHeadingBlock | null {
  const rawLevel = token.tag.replace('h', '');
  if (!HEADING_LEVELS.has(rawLevel)) return null;
  return {
    type: 'heading',
    level: Number(rawLevel) as BlocksHeadingBlock['level'],
    children: withFallbackChildren(inlineTokenToNodes(inlineToken)),
  };
}

function codeBlock(content: string, language?: string): BlocksCodeBlock {
  const block: BlocksCodeBlock = {
    type: 'code',
    children: [{ type: 'text', text: content }],
  };
  if (language) block.language = language;
  return block;
}

/**
 * Converts Markdown text into native Strapi 5 Blocks data.
 *
 * Supported Markdown:
 *  - headings `#` ... `######`
 *  - paragraphs (blank lines separate paragraphs)
 *  - bold `**text**`, italic `*text*`, strikethrough `~~text~~`, inline code
 *  - unordered (`-`) and ordered (`1.`) lists, including nested lists
 *  - links `[label](url)`
 *  - blockquotes `> ...`
 *  - fenced + indented code blocks
 *  - horizontal rules `---` (rendered as an em-dash paragraph, see README)
 *
 * Raw HTML is never imported as HTML — markdown-it (configured with `html:
 * false`) keeps it as plain text, so it can never become active markup. Unsafe
 * link targets are kept as plain text.
 */
export function markdownToBlocks(markdown: string): BlocksValue {
  const tokens = MARKDOWN_IT.parse(markdown, {});
  const blocks: BlocksValue = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case 'heading_open': {
        const inlineToken = tokens[i + 1];
        if (isInline(inlineToken)) {
          const heading = headingBlock(token, inlineToken);
          if (heading) blocks.push(heading);
        }
        i += 3;
        break;
      }

      case 'paragraph_open': {
        const inlineToken = tokens[i + 1];
        if (isInline(inlineToken)) {
          blocks.push({ type: 'paragraph', children: withFallbackChildren(inlineTokenToNodes(inlineToken)) });
        }
        i += 3;
        break;
      }

      case 'bullet_list_open':
      case 'ordered_list_open': {
        const parsed = parseList(tokens, i);
        blocks.push(parsed.block);
        i = parsed.nextIndex;
        break;
      }

      case 'blockquote_open': {
        const parsed = parseBlockquote(tokens, i);
        blocks.push(parsed.block);
        i = parsed.nextIndex;
        break;
      }

      case 'fence': {
        blocks.push(codeBlock(token.content, sanitizeLanguage(token.info)));
        i += 1;
        break;
      }

      case 'code_block': {
        blocks.push(codeBlock(token.content));
        i += 1;
        break;
      }

      case 'hr': {
        // Strapi 5 Blocks has no horizontal-rule block. Render a separator
        // paragraph so the visual break survives the conversion.
        blocks.push({ type: 'paragraph', children: [{ type: 'text', text: '\u2014' }] });
        i += 1;
        break;
      }

      default: {
        // html_block and any other unsupported token types are skipped.
        i += 1;
        break;
      }
    }
  }

  return blocks;
}

/** Returns true when the given Blocks value is non-empty. */
export function hasContent(blocks: BlocksValue | undefined | null): blocks is BlocksValue {
  return Array.isArray(blocks) && blocks.length > 0;
}