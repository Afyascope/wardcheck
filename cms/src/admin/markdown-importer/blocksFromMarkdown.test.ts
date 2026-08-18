import { describe, expect, it } from 'vitest';

import { hasContent, markdownToBlocks, sanitizeLanguage, sanitizeUrl } from './blocksFromMarkdown';

describe('sanitizeUrl', () => {
  it('allows http/https/mailto/tel/relative targets', () => {
    expect(sanitizeUrl('https://wardcheck.co.ke/search')).toBe('https://wardcheck.co.ke/search');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('mailto:hi@wardcheck.co.ke')).toBe('mailto:hi@wardcheck.co.ke');
    expect(sanitizeUrl('tel:+254700000000')).toBe('tel:+254700000000');
    expect(sanitizeUrl('/articles/some-article')).toBe('/articles/some-article');
    expect(sanitizeUrl('#section')).toBe('#section');
  });

  it('rejects javascript: and other unsafe schemes', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });
});

describe('sanitizeLanguage', () => {
  it('extracts the language hint and strips unsafe characters', () => {
    expect(sanitizeLanguage('javascript')).toBe('javascript');
    expect(sanitizeLanguage('js extra=1')).toBe('js');
    expect(sanitizeLanguage('bash\n')).toBe('bash');
    expect(sanitizeLanguage('')).toBeUndefined();
  });
});

describe('markdownToBlocks - editorial example (requirement 14)', () => {
  const markdown = `# Article title

Introduction paragraph.

## Section One

This is a paragraph.

### Subsection

- Item one
- Item two
- Item three

## Section Two

1. First item
2. Second item
3. Third item

> Important information.

[Search WardCheck](https://wardcheck.co.ke/search)`;

  it('produces the expected block sequence', () => {
    const blocks = markdownToBlocks(markdown);

    expect(blocks).toHaveLength(10);

    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 1,
      children: [{ type: 'text', text: 'Article title' }],
    });
    expect(blocks[1]).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Introduction paragraph.' }],
    });
    expect(blocks[2]).toEqual({ type: 'heading', level: 2, children: [{ type: 'text', text: 'Section One' }] });
    expect(blocks[3]).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', text: 'This is a paragraph.' }],
    });
    expect(blocks[4]).toEqual({ type: 'heading', level: 3, children: [{ type: 'text', text: 'Subsection' }] });
    expect(blocks[5]).toEqual({
      type: 'list',
      format: 'unordered',
      children: [
        { type: 'list-item', children: [{ type: 'text', text: 'Item one' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Item two' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Item three' }] },
      ],
    });
    expect(blocks[6]).toEqual({ type: 'heading', level: 2, children: [{ type: 'text', text: 'Section Two' }] });
    expect(blocks[7]).toEqual({
      type: 'list',
      format: 'ordered',
      children: [
        { type: 'list-item', children: [{ type: 'text', text: 'First item' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Second item' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Third item' }] },
      ],
    });
    expect(blocks[8]).toEqual({
      type: 'quote',
      children: [{ type: 'text', text: 'Important information.' }],
    });
    expect(blocks[9]).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://wardcheck.co.ke/search',
          rel: '',
          target: '',
          children: [{ type: 'text', text: 'Search WardCheck' }],
        },
      ],
    });
  });
});

describe('markdownToBlocks - inline formatting', () => {
  it('supports bold, italic, inline code and strikethrough', () => {
    const blocks = markdownToBlocks('**bold** and *italic* and \`code\` and ~~strike~~ text.');
    expect(blocks).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'bold', bold: true },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'italic', italic: true },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'code', code: true },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'strike', strikethrough: true },
          { type: 'text', text: ' text.' },
        ],
      },
    ]);
  });

  it('combines bold + italic in one node', () => {
    const blocks = markdownToBlocks('***both***');
    expect(blocks[0]?.type === 'paragraph' ? blocks[0].children : []).toContainEqual({
      type: 'text',
      text: 'both',
      bold: true,
      italic: true,
    });
  });

  it('does not produce a link node for an unsafe target', () => {
    // markdown-it rejects `javascript:` destinations outright, so the source
    // text survives as escaped literal text and never as an active link.
    const blocks = markdownToBlocks('[click](javascript:alert(1))');
    const children = blocks[0]?.type === 'paragraph' ? blocks[0].children : [];
    expect(children).toEqual([{ type: 'text', text: '[click](javascript:alert(1))' }]);
    expect(children.some((node) => node.type === 'link')).toBe(false);
  });
});

describe('markdownToBlocks - lists', () => {
  it('supports nested lists', () => {
    const blocks = markdownToBlocks('- Top\n  - Nested one\n  - Nested two\n- Bottom');
    expect(blocks).toHaveLength(1);
    const list = blocks[0];
    if (list?.type !== 'list') throw new Error('expected list');
    expect(list.format).toBe('unordered');
    expect(list.children[0]).toEqual({ type: 'list-item', children: [{ type: 'text', text: 'Top' }] });
    expect(list.children[1]).toEqual({
      type: 'list',
      format: 'unordered',
      indentLevel: 1,
      children: [
        { type: 'list-item', children: [{ type: 'text', text: 'Nested one' }] },
        { type: 'list-item', children: [{ type: 'text', text: 'Nested two' }] },
      ],
    });
    expect(list.children[2]).toEqual({ type: 'list-item', children: [{ type: 'text', text: 'Bottom' }] });
  });

  it('increments indentLevel for each nesting depth', () => {
    const blocks = markdownToBlocks('- Top\n  - Mid\n    - Deep\n- Bottom');
    const list = blocks[0];
    if (list?.type !== 'list') throw new Error('expected list');
    const mid = list.children[1];
    if (mid?.type !== 'list') throw new Error('expected nested list');
    expect(mid.indentLevel).toBe(1);
    const deep = mid.children[1];
    if (deep?.type !== 'list') throw new Error('expected deep nested list');
    expect(deep.indentLevel).toBe(2);
    expect(deep.children).toEqual([{ type: 'list-item', children: [{ type: 'text', text: 'Deep' }] }]);
  });
});

describe('markdownToBlocks - code blocks', () => {
  it('converts fenced code blocks with a language hint', () => {
    const blocks = markdownToBlocks('```js\nconst x = 1;\n```');
    expect(blocks).toEqual([
      { type: 'code', language: 'js', children: [{ type: 'text', text: 'const x = 1;\n' }] },
    ]);
  });

  it('converts indented code blocks', () => {
    const blocks = markdownToBlocks('    const y = 2;');
    expect(blocks).toEqual([{ type: 'code', children: [{ type: 'text', text: 'const y = 2;\n' }] }]);
  });
});

describe('markdownToBlocks - horizontal rules', () => {
  it('renders an HR as a separator paragraph (Strapi has no HR block)', () => {
    const blocks = markdownToBlocks('Before\n\n---\n\nAfter');
    expect(blocks[0]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'Before' }] });
    expect(blocks[1]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: '\u2014' }] });
    expect(blocks[2]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'After' }] });
  });
});

describe('markdownToBlocks - safety', () => {
  it('keeps raw HTML as escaped literal text (never active HTML)', () => {
    const blocks = markdownToBlocks('Text\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
    expect(blocks).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'Text' }] },
      { type: 'paragraph', children: [{ type: 'text', text: '<script>alert(1)</script>' }] },
      { type: 'paragraph', children: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] },
    ]);
  });

  it('never emits an active HTML tag node', () => {
    const blocks = markdownToBlocks('<script>alert(1)</script>');
    expect(blocks).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: '<script>alert(1)</script>' }] },
    ]);
  });

  it('treats empty input as empty blocks', () => {
    expect(markdownToBlocks('')).toEqual([]);
    expect(markdownToBlocks('   ')).toEqual([]);
  });
});

describe('hasContent', () => {
  it('detects empty vs non-empty blocks values', () => {
    expect(hasContent([])).toBe(false);
    expect(hasContent(undefined)).toBe(false);
    expect(hasContent(null)).toBe(false);
    expect(hasContent([{ type: 'paragraph', children: [{ type: 'text', text: 'x' }] }])).toBe(true);
  });
});
