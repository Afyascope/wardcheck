import { format } from "date-fns";
import { ArrowRight, CalendarDays, Tag } from "lucide-react";
import { Link } from "wouter";

export interface ArticleCardData {
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  imageUrl?: string | null;
}

interface ArticleCardProps extends ArticleCardData {
  href: string;
  ctaLabel?: string;
  featured?: boolean;
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  author,
  imageUrl,
  href,
  ctaLabel = "Read article",
  featured = false,
}: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {imageUrl && (
        <div className={featured ? "aspect-[16/7] w-full overflow-hidden" : "aspect-[16/9] w-full overflow-hidden"}>
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className={featured ? "flex flex-1 flex-col p-8" : "flex flex-1 flex-col p-5"}>
        {(category || publishedAt) && (
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            {category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                <Tag className="h-3 w-3" />
                {category}
              </span>
            )}
            {publishedAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(publishedAt), "MMMM d, yyyy")}
              </span>
            )}
            {author && <span className="truncate">By {author}</span>}
          </div>
        )}

        <h3
          className={
            featured
              ? "text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors"
              : "text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors"
          }
        >
          {title}
        </h3>

        {excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
