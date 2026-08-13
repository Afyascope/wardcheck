import { getCmsImageUrl } from "@/lib/cms";
import type { CmsBlock, CmsInlineNode, CmsLinkNode, CmsTextNode } from "@/types/cms";

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

function InlineContent({ children }: { children: CmsInlineNode[] }) {
  return (
    <>
      {children.map((node, index) =>
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

function Block({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p>{block.children && <InlineContent children={block.children} />}</p>;

    case "heading": {
      const Tag = `h${headingLevel(block.level)}` as "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag>{block.children && <InlineContent children={block.children} />}</Tag>;
    }

    case "list": {
      const Tag = block.format === "ordered" ? "ol" : "ul";
      return (
        <Tag>
          {block.children.map((item, index) => (
            <li key={index}>{item.children && <InlineContent children={item.children} />}</li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return <blockquote>{block.children && <InlineContent children={block.children} />}</blockquote>;

    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4">
          <code className="font-mono text-sm">
            {block.children.map((child, index) => (
              <span key={index}>{child.text}</span>
            ))}
          </code>
        </pre>
      );

    case "image": {
      const src = getCmsImageUrl(block.image, "large");
      if (!src) return null;
      return (
        <figure>
          <img
            src={src}
            alt={block.image.alternativeText ?? block.image.name ?? ""}
            loading="lazy"
            className="w-full h-auto rounded-xl"
          />
          {block.image.caption && <figcaption>{block.image.caption}</figcaption>}
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
export function RichBlocks({ blocks }: { blocks: CmsBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline prose-img:rounded-xl prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
