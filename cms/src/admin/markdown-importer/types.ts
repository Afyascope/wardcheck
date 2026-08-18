/**
 * Structural types for Strapi 5 Blocks field data.
 *
 * These mirror the Strapi 5 blocks JSON contract (see
 * `@strapi/types` -> `Schema.Attribute.Blocks` / the entity validator) so that
 * the Markdown importer produces data that the Blocks editor, the entity
 * validator and the WardCheck frontend renderer all accept.
 */

export interface BlocksTextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface BlocksLinkNode {
  type: 'link';
  url: string;
  rel: string;
  target: string;
  children: BlocksTextNode[];
}

export type BlocksInlineNode = BlocksTextNode | BlocksLinkNode;

export interface BlocksParagraphBlock {
  type: 'paragraph';
  children: BlocksInlineNode[];
}

export interface BlocksHeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: BlocksInlineNode[];
}

export interface BlocksQuoteBlock {
  type: 'quote';
  children: BlocksInlineNode[];
}

export interface BlocksCodeBlock {
  type: 'code';
  language?: string;
  children: BlocksTextNode[];
}

export interface BlocksListItemBlock {
  type: 'list-item';
  children: BlocksInlineNode[];
}

export interface BlocksListBlock {
  type: 'list';
  format: 'ordered' | 'unordered';
  children: Array<BlocksListItemBlock | BlocksListBlock>;
  indentLevel?: number;
}

export type BlocksBlock =
  | BlocksParagraphBlock
  | BlocksHeadingBlock
  | BlocksQuoteBlock
  | BlocksCodeBlock
  | BlocksListBlock;

export type BlocksValue = BlocksBlock[];