import { Link } from "wouter";
import { ArrowRight, BookOpen, Compass, Wallet, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { FullPageLoader } from "@/components/ui/loaders";
import { useCmsGuides } from "@/hooks/useCms";
import { useSeo, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/hooks/use-seo";
import { getCmsImageUrl } from "@/lib/cms";
import { GUIDE_KINDS, type GuideKindMeta } from "@/lib/guides";

const guideIcons: Record<GuideKindMeta["kind"], typeof Wallet> = {
  salary: Wallet,
  career: Compass,
  workplace: Users,
};

export default function GuidesOverview() {
  const salary = useCmsGuides("salary", 3);
  const career = useCmsGuides("career", 3);
  const workplace = useCmsGuides("workplace", 3);

  const kindQueries = {
    salary,
    career,
    workplace,
  };

  const anyLoading = GUIDE_KINDS.some((guide) => kindQueries[guide.kind].isLoading);
  const anyError = GUIDE_KINDS.some((guide) => kindQueries[guide.kind].isError);

  useSeo({
    title: "Guides | WardCheck",
    description:
      "Salary guides, career guides, and workplace guides for healthcare professionals in Kenya.",
    path: "/guides",
    keywords: "healthcare career guides, salary guides Kenya, workplace guides",
    jsonLd: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  });

  return (
    <AppLayout>
      <div className="flex-1">
        <section className="border-b bg-muted/20 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              WardCheck Guides
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Guides
            </h1>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Practical guides for healthcare professionals — from salary expectations to
              choosing a good employer.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {anyLoading ? (
              <FullPageLoader />
            ) : anyError ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Guides are currently unavailable
                </h2>
                <p className="text-muted-foreground">
                  We couldn't load the guides right now. Please check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-16">
                {GUIDE_KINDS.map((guide) => {
                  const data = kindQueries[guide.kind].data ?? [];
                  const Icon = guideIcons[guide.kind];
                  return (
                    <section key={guide.kind}>
                      <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-5 w-5 text-primary" />
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                              {guide.title}
                            </h2>
                          </div>
                          <p className="text-muted-foreground">{guide.description}</p>
                        </div>
                        <Link
                          to={`/guides/${guide.kind}`}
                          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          View all
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>

                      {data.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {data.map((item) => (
                            <ArticleCard
                              key={item.slug}
                              title={item.title}
                              slug={item.slug}
                              excerpt={item.excerpt}
                              category={guide.label}
                              publishedAt={item.publishedAt}
                              author={item.author?.name ?? null}
                              imageUrl={getCmsImageUrl(item.featuredImage, "medium")}
                              href={`/guides/${guide.kind}/${item.slug}`}
                              ctaLabel={guide.ctaLabel}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                          No {guide.label.toLowerCase()} published yet. Check back soon.
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
