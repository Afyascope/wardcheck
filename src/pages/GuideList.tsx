import { useParams, Link } from "wouter";
import { ArrowLeft, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { FullPageLoader } from "@/components/ui/loaders";
import { NotFoundPage } from "@/components/NotFound";
import { useCmsGuides } from "@/hooks/useCms";
import { useSeo, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/hooks/use-seo";
import { getCmsImageUrl } from "@/lib/cms";
import { getGuideKindMeta } from "@/lib/guides";

export default function GuideList() {
  const params = useParams();
  const type = params.type ?? "";
  const meta = getGuideKindMeta(type);

  const { data: guides, isLoading, error } = useCmsGuides(
    meta?.kind ?? "salary",
    24,
  );

  useSeo({
    title: meta ? `${meta.title} | WardCheck` : "Guides | WardCheck",
    description: meta
      ? meta.description
      : "Guides for healthcare professionals from WardCheck.",
    path: `/guides/${type}`,
    keywords: "healthcare guides, career guides Kenya",
    jsonLd: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  });

  if (!meta) {
    return <NotFoundPage />;
  }

  return (
    <AppLayout>
      <div className="flex-1">
        <section className="border-b bg-muted/20 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/guides"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to all guides
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              WardCheck {meta.title}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {meta.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {meta.description}
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <FullPageLoader />
            ) : error ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {meta.title} are currently unavailable
                </h2>
                <p className="text-muted-foreground">
                  We couldn't load the guides right now. Please check back soon.
                </p>
              </div>
            ) : !guides || guides.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  No {meta.title.toLowerCase()} published yet
                </h2>
                <p className="text-muted-foreground">
                  Check back soon — we're working on new healthcare guides.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {guides.map((guide) => (
                  <ArticleCard
                    key={guide.slug}
                    title={guide.title}
                    slug={guide.slug}
                    excerpt={guide.excerpt}
                    category={meta.label}
                    publishedAt={guide.publishedAt}
                    author={guide.author?.name ?? null}
                    imageUrl={getCmsImageUrl(guide.featuredImage, "medium")}
                    href={`/guides/${type}/${guide.slug}`}
                    ctaLabel={meta.ctaLabel}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
