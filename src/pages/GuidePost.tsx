import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { CalendarDays, ChevronRight, Tag, User, Wallet } from "lucide-react";
import { useCmsArticles, useCmsGuideBySlug, useCmsGuides } from "@/hooks/useCms";
import { useSeo, ORGANIZATION_SCHEMA, createBreadcrumbSchema, SITE_URL } from "@/hooks/use-seo";
import { AppLayout } from "@/components/layout/AppLayout";
import { RichBlocks } from "@/components/editorial/RichBlocks";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { FullPageLoader } from "@/components/ui/loaders";
import { NotFoundPage } from "@/components/NotFound";
import { getCmsImageUrl } from "@/lib/cms";
import { getGuideKindMeta } from "@/lib/guides";
import type { CmsSalaryGuide } from "@/types/cms";
import { getRelatedEditorial } from "@/lib/editorial";
import { EditorialCta } from "@/components/editorial/EditorialCta";

export default function GuidePost() {
  const params = useParams();
  const type = params.type ?? "";
  const slug = params.slug ?? "";
  const meta = getGuideKindMeta(type);

  const { data: guide, isLoading, error } = useCmsGuideBySlug(meta?.kind ?? "salary", slug);
  const { data: allGuides } = useCmsGuides(meta?.kind ?? "salary", 24);
  const { data: articles } = useCmsArticles(12);

  const relatedGuides = guide ? getRelatedEditorial(guide, allGuides ?? []) : [];
  const relatedArticles = guide ? getRelatedEditorial(guide, articles ?? []) : [];

  const canonical = guide?.seo?.canonicalUrl || `${SITE_URL}/guides/${type}/${slug}`;
  const ogImage = guide
    ? getCmsImageUrl(guide.seo?.ogImage ?? guide.featuredImage, "large")
    : undefined;

  const guideJsonLd = guide
    ? {
        "@type": "Article",
        headline: guide.title,
        ...(guide.excerpt ? { description: guide.excerpt } : {}),
        ...(guide.publishedAt ? { datePublished: guide.publishedAt } : {}),
        ...(guide.updatedAt ? { dateModified: guide.updatedAt } : {}),
        ...(guide.author?.name
          ? { author: { "@type": "Person", name: guide.author.name } }
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

  const breadcrumbJsonLd = guide
    ? createBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: meta?.title ?? "Guides", path: `/guides/${type}` },
        { name: guide.title, path: `/guides/${type}/${slug}` },
      ])
    : null;

  const jsonLd = [ORGANIZATION_SCHEMA, breadcrumbJsonLd, guideJsonLd].filter(
    Boolean,
  ) as Record<string, unknown>[];

  useSeo({
    title: guide
      ? `${guide.seo?.ogTitle ?? guide.seo?.seoTitle ?? guide.title} | WardCheck`
      : "Guide | WardCheck",
    description: guide
      ? (guide.seo?.ogDescription ??
        guide.seo?.seoDescription ??
        guide.excerpt ??
        "Healthcare guide from WardCheck.")
      : "Healthcare guide from WardCheck.",
    path: `/guides/${type}/${slug}`,
    canonicalUrl: canonical,
    type: "article",
    robots: "index,follow",
    ogImage: ogImage ?? undefined,
    ogTitle: guide?.seo?.ogTitle ?? undefined,
    ogDescription: guide?.seo?.ogDescription ?? undefined,
    keywords: guide?.seo?.seoKeywords ?? undefined,
    jsonLd,
  });

  if (!meta) {
    return <NotFoundPage />;
  }

  if (isLoading) {
    return (
      <AppLayout>
        <FullPageLoader />
      </AppLayout>
    );
  }

  if (error || !guide) {
    return <NotFoundPage />;
  }

  const salaryGuide =
    type === "salary" && "salaryRange" in guide ? (guide as CmsSalaryGuide) : null;

  return (
    <AppLayout>
      <div className="flex-1 py-12 px-4">
        <article className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href="/guides" className="hover:text-primary">Guides</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href={`/guides/${type}`} className="hover:text-primary">{meta.title}</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="truncate text-foreground" aria-current="page">{guide.title}</span>
          </nav>

          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <Link
                href={`/guides/${type}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Tag className="h-3 w-3" />
                {meta.label}
              </Link>
              {guide.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(guide.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {guide.title}
            </h1>

            {guide.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {guide.excerpt}
              </p>
            )}

            {guide.author && (
              <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-6">
                {guide.author.photo ? (
                  <img
                    src={getCmsImageUrl(guide.author.photo, "thumbnail") ?? undefined}
                    alt={guide.author.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-foreground">{guide.author.name}</div>
                  {guide.author.role && (
                    <div className="text-sm text-muted-foreground">{guide.author.role}</div>
                  )}
                </div>
              </div>
            )}
          </header>

          {salaryGuide && (
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                <Wallet className="h-4 w-4" />
                Salary snapshot
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {salaryGuide.profession && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Profession
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">{salaryGuide.profession}</dd>
                  </div>
                )}
                {salaryGuide.location && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Location
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">{salaryGuide.location}</dd>
                  </div>
                )}
                {salaryGuide.salaryRange && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Expected salary range
                    </dt>
                    <dd className="mt-1 text-lg font-bold text-foreground">{salaryGuide.salaryRange}</dd>
                  </div>
                )}
                {salaryGuide.salaryNotes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notes
                    </dt>
                    <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {salaryGuide.salaryNotes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {(() => {
            const imageUrl = getCmsImageUrl(guide.featuredImage, "large");
            if (!imageUrl) return null;
            return (
              <img
                src={imageUrl}
                alt={guide.featuredImage?.alternativeText ?? guide.title}
                className="w-full rounded-xl border border-border/50 shadow-sm mb-10"
              />
            );
          })()}

          <div className="mb-12">
            <RichBlocks blocks={guide.content} />
          </div>

          {relatedGuides.length > 0 && (
            <section className="border-t border-border/60 pt-10">
              <h2 className="text-xl font-bold text-foreground mb-6">Related {meta.label.toLowerCase()}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedGuides.map((related) => (
                  <ArticleCard
                    key={related.slug}
                    title={related.title}
                    slug={related.slug}
                    excerpt={related.excerpt}
                    category={meta.label}
                    publishedAt={related.publishedAt}
                    author={related.author?.name ?? null}
                    imageUrl={getCmsImageUrl(related.featuredImage, "medium")}
                    href={`/guides/${type}/${related.slug}`}
                    ctaLabel={meta.ctaLabel}
                  />
                ))}
              </div>
            </section>
          )}
          {relatedArticles.length > 0 && (
            <section className="border-t border-border/60 pt-10">
              <h2 className="mb-6 text-xl font-bold text-foreground">Related articles</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((article) => (
                  <ArticleCard
                    key={article.slug}
                    title={article.title}
                    slug={article.slug}
                    excerpt={article.excerpt}
                    category={article.category?.name ?? null}
                    publishedAt={article.publishedAt}
                    author={article.author?.name ?? null}
                    imageUrl={getCmsImageUrl(article.featuredImage, "medium")}
                    href={`/blog/${article.slug}`}
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
