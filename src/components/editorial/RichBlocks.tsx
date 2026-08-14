import { getCmsImageUrl } from "@/lib/cms";
import type { CmsBlock, CmsInlineNode, CmsLinkNode, CmsMedia, CmsTextNode } from "@/types/cms";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInlineNode(value: unknown): value is CmsInlineNode {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "text") return typeof value.text === "string";
  return value.type === "link" && typeof value.url === "string" && Array.isArray(value.children);
}

function safeInlineNodes(value: unknown): CmsInlineNode[] {
  return Array.isArray(value) ? value.filter(isInlineNode) : [];
}

function ExternalLink({ url, children }: { url: string; children: React.ReactNode }) {
  const isExternal = /^https?:\/\//i.test(url);
  return (
    <a
      href={url}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  );
}

function InlineText({ node }: { node: CmsTextNode }) {
  let content: React.ReactNode = node.text;

  if (node.link?.url) {
    content = <ExternalLink url={node.link.url}>{content}</ExternalLink>;
  }
  if (node.code) {
    content = (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]">
        {content}
      </code>
    );
  }
  if (node.bold) {
    content = <strong>{content}</strong>;
  }
  if (node.italic) {
    content = <em>{content}</em>;
  }
  if (node.underline) {
    content = <u>{content}</u>;
  }
  if (node.strikethrough) {
    content = <s>{content}</s>;
  }

  return <>{content}</>;
}

function InlineContent({ children }: { children: unknown }) {
  const safeChildren = safeInlineNodes(children);

  return (
    <>
      {safeChildren.map((node, index) =>
        node.type === "link" ? (
          <ExternalLink key={index} url={(node as CmsLinkNode).url}>
            <InlineContent children={(node as CmsLinkNode).children} />
          </ExternalLink>
        ) : (
          <InlineText key={index} node={node as CmsTextNode} />
        ),
      )}
    </>
  );
}

const headingLevel = (level: number) => Math.min(Math.max(level === 1 ? 2 : level, 2), 6);

function Block({ block }: { block: unknown }) {
  if (!isRecord(block) || typeof block.type !== "string") return null;

  switch (block.type) {
    case "paragraph":
      return <p><InlineContent children={block.children} /></p>;

    case "heading": {
      const level = typeof block.level === "number" ? block.level : 2;
      const Tag = `h${headingLevel(level)}` as "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag><InlineContent children={block.children} /></Tag>;
    }

    case "list": {
      const Tag = block.format === "ordered" ? "ol" : "ul";
      const items = Array.isArray(block.children) ? block.children : [];
      return (
        <Tag>
          {items.map((item, index) => (
            <li key={index}>
              <InlineContent children={isRecord(item) ? item.children : undefined} />
            </li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return <blockquote><InlineContent children={block.children} /></blockquote>;

    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4">
          <code className="font-mono text-sm">
            {(Array.isArray(block.children) ? block.children : []).map((child, index) => (
              <span key={index}>{isRecord(child) && typeof child.text === "string" ? child.text : ""}</span>
            ))}
          </code>
        </pre>
      );

    case "image": {
      const image = isRecord(block.image) ? block.image : null;
      const src = getCmsImageUrl(image as CmsMedia | null, "large");
      if (!src) return null;
      return (
        <figure>
          <img
            src={src}
            alt={typeof image?.alternativeText === "string" ? image.alternativeText : typeof image?.name === "string" ? image.name : ""}
            loading="lazy"
            className="w-full h-auto rounded-xl"
          />
          {typeof image?.caption === "string" && <figcaption>{image.caption}</figcaption>}
        </figure>
      );
    }

    default:
      return null;
  }
}

/**
 * Renders Strapi Blocks content as semantic HTML (prose) so it stays readable,
 * accessible, and SEO-friendly. Never dumps raw Strapi JSON to the page.
 */
export function RichBlocks({ blocks }: { blocks?: CmsBlock[] | null }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline prose-img:rounded-xl prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
