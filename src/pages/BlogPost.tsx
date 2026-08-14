import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, ChevronRight, Tag, User } from "lucide-react";
import { useCmsArticleBySlug, useCmsArticles } from "@/hooks/useCms";
import { useSeo, ORGANIZATION_SCHEMA, createBreadcrumbSchema, SITE_URL } from "@/hooks/use-seo";
import { AppLayout } from "@/components/layout/AppLayout";
import { RichBlocks } from "@/components/editorial/RichBlocks";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { FullPageLoader } from "@/components/ui/loaders";
import { getCmsImageUrl } from "@/lib/cms";
import { trackEvent } from "@/lib/analytics";
import { getRelatedEditorial } from "@/lib/editorial";
import { EditorialCta } from "@/components/editorial/EditorialCta";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug ?? "";

  const { data: article, isLoading, error } = useCmsArticleBySlug(slug);
  const { data: allArticles } = useCmsArticles(24);

  useEffect(() => {
    if (!article) return;
    trackEvent("article_viewed", {
      article_id: article.documentId ?? article.id,
      article_title: article.title,
      category: article.category?.name ?? null,
    });
  }, [article]);

  const relatedArticles = article ? getRelatedEditorial(article, allArticles ?? []) : [];

  const canonical = article?.seo?.canonicalUrl || `${SITE_URL}/blog/${slug}`;
  const ogImage = article
    ? getCmsImageUrl(article.seo?.ogImage ?? article.featuredImage, "large")
    : undefined;

  const articleJsonLd = article
    ? {
        "@type": "Article",
        headline: article.title,
        ...(article.excerpt ? { description: article.excerpt } : {}),
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
        ...(article.author?.name
          ? { author: { "@type": "Person", name: article.author.name } }
          : {}),
        ...(ogImage ? { image: [ogImage] } : {}),
        mainEntityOfPage: canonical,
        publisher: {
          "@type": "Organization",
          name: "WardCheck",
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/wardcheck-logo.png` },
        },
      }
    : null;

  const breadcrumbJsonLd = article
    ? createBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Articles", path: "/blog" },
        { name: article.title, path: `/blog/${slug}` },
      ])
    : null;

  const jsonLd = [ORGANIZATION_SCHEMA, breadcrumbJsonLd, articleJsonLd].filter(
    Boolean,
  ) as Record<string, unknown>[];

  useSeo({
    title: article
      ? `${article.seo?.ogTitle ?? article.seo?.seoTitle ?? article.title} | WardCheck`
      : "Article | WardCheck",
    description: article
      ? (article.seo?.ogDescription ??
        article.seo?.seoDescription ??
        article.excerpt ??
        "Healthcare career article from WardCheck.")
      : "Healthcare career article from WardCheck.",
    path: `/blog/${slug}`,
    canonicalUrl: canonical,
    type: "article",
    robots: "index,follow",
    ogImage: ogImage ?? undefined,
    ogTitle: article?.seo?.ogTitle ?? undefined,
    ogDescription: article?.seo?.ogDescription ?? undefined,
    keywords: article?.seo?.seoKeywords ?? undefined,
    jsonLd,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <FullPageLoader />
      </AppLayout>
    );
  }

  if (error || !article) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold">Article unavailable</h1>
            <p className="mt-4 text-muted-foreground">
              We couldn&apos;t load this article right now. Please try again soon.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 py-12 px-4">
        <article className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href="/blog" className="hover:text-primary">WardCheck Insights</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="truncate text-foreground" aria-current="page">{article.title}</span>
          </nav>

          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              {article.category && (
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <Tag className="h-3 w-3" />
                  {article.category.name}
                </Link>
              )}
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(article.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {article.author && (
              <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
                {article.author.photo ? (
                  <img
                    src={getCmsImageUrl(article.author.photo, "thumbnail") ?? undefined}
                    alt={article.author.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-foreground">{article.author.name}</div>
                  {article.author.role && (
                    <div className="text-sm text-muted-foreground">{article.author.role}</div>
                  )}
                </div>
              </div>
            )}
          </header>

          {(() => {
            const imageUrl = getCmsImageUrl(article.featuredImage, "large");
            if (!imageUrl) return null;
            return (
              <img
                src={imageUrl}
                alt={article.featuredImage?.alternativeText ?? article.title}
                className="w-full rounded-xl border border-border/50 shadow-sm mb-10"
              />
            );
          })()}

          <div className="mb-12 max-w-[68ch]">
            <RichBlocks blocks={article.content} />
          </div>

          {relatedArticles.length > 0 && (
            <section className="border-t border-border/60 pt-10">
              <h2 className="text-xl font-bold text-foreground mb-6">Related articles</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((related) => (
                  <ArticleCard
                    key={related.slug}
                    title={related.title}
                    slug={related.slug}
                    excerpt={related.excerpt}
                    category={related.category?.name ?? null}
                    publishedAt={related.publishedAt}
                    author={related.author?.name ?? null}
                    imageUrl={getCmsImageUrl(related.featuredImage, "medium")}
                    href={`/blog/${related.slug}`}
                    ctaLabel="Read article"
                  />
                ))}
              </div>
            </section>
          )}
          <EditorialCta />
        </article>
      </div>
    </AppLayout>
  );
}
