/**
 * Safe preview renderer for converted Strapi 5 Blocks data.
 *
 * Renders only the structured Blocks JSON produced by `markdownToBlocks`.
 * Nothing here ever renders HTML from user input: text is rendered through
 * React (which escapes it) so raw HTML / script content can only ever appear
 * as literal text.
 */

import styled from 'styled-components';

import type {
  BlocksBlock,
  BlocksInlineNode,
  BlocksLinkNode,
  BlocksListBlock,
  BlocksTextNode,
  BlocksValue,
} from './types';

const PreviewRoot = styled.div`
  color: #32324d;
  font-size: 0.875rem;
  line-height: 1.6;
  word-break: break-word;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 1rem 0 0.4rem;
  }
  h3,
  h4,
  h5,
  h6 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0.9rem 0 0.35rem;
  }
  p {
    margin: 0 0 0.75rem;
  }
  ul,
  ol {
    margin: 0 0 0.75rem;
    padding-left: 1.4rem;
  }
  li {
    margin-bottom: 0.25rem;
  }
  blockquote {
    margin: 0 0 0.75rem;
    padding: 0.35rem 0.9rem;
    border-left: 3px solid #6665ff;
    background: #f6f6f9;
    border-radius: 0 4px 4px 0;
  }
  a {
    color: #4945ff;
    text-decoration: underline;
  }
  pre {
    background: #101012;
    color: #ffffff;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
  }
  code {
    background: #eaeaef;
    border-radius: 3px;
    padding: 0.1rem 0.3rem;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 0.8rem;
  }
  pre code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
`;

function InlineText({ node }: { node: BlocksTextNode }) {
  let content: React.ReactNode = node.text;

  if (node.code) content = <code>{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;

  return <>{content}</>;
}

function InlineChildren({ children }: { children: BlocksInlineNode[] }) {
  return (
    <>
      {children.map((node, index) =>
        node.type === 'link' ? (
          <a key={index} href={(node as BlocksLinkNode).url}>
            <InlineChildren children={(node as BlocksLinkNode).children} />
          </a>
        ) : (
          <InlineText key={index} node={node as BlocksTextNode} />
        ),
      )}
    </>
  );
}

function ListItems({ list }: { list: BlocksListBlock }) {
  return (
    <>
      {list.children.map((child, index) => {
        if (child.type === 'list') {
          return <ListItems key={index} list={child} />;
        }
        return (
          <li key={index}>
            <InlineChildren children={child.children} />
          </li>
        );
      })}
    </>
  );
}

function PreviewBlock({ block }: { block: BlocksBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p>{<InlineChildren children={block.children} />}</p>;
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return <Tag>{<InlineChildren children={block.children} />}</Tag>;
    }
    case 'list': {
      const Tag = block.format === 'ordered' ? 'ol' : 'ul';
      return (
        <Tag>
          <ListItems list={block} />
        </Tag>
      );
    }
    case 'quote':
      return <blockquote>{<InlineChildren children={block.children} />}</blockquote>;
    case 'code':
      return (
        <pre>
          <code>
            {block.children.map((node, index) => (
              <span key={index}>{node.text}</span>
            ))}
          </code>
        </pre>
      );
    default:
      return null;
  }
}

export function BlocksPreview({ blocks }: { blocks: BlocksValue }) {
  return (
    <PreviewRoot>
      {blocks.map((block, index) => (
        <PreviewBlock key={index} block={block} />
      ))}
    </PreviewRoot>
  );
}
