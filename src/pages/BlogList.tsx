import { useCmsArticles } from "@/hooks/useCms";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { FullPageLoader } from "@/components/ui/loaders";
import { useSeo, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/hooks/use-seo";
import { getCmsImageUrl } from "@/lib/cms";
import { Link } from "wouter";
import { Newspaper, ArrowLeft } from "lucide-react";

export default function BlogList() {
  const { data: articles, isLoading, error } = useCmsArticles(12);

  useSeo({
    title: "WardCheck Insights | WardCheck",
    description:
      "Read healthcare career articles, workplace guides, and salary insights from WardCheck. Understand your next employer before you decide.",
    path: "/blog",
    keywords: "healthcare careers Kenya, workplace transparency, hospital reviews Kenya",
    jsonLd: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA],
  });

  return (
    <AppLayout>
      <div className="flex-1">
        <section className="border-b bg-muted/20 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              <Newspaper className="h-3.5 w-3.5" />
              WardCheck Insights
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              WardCheck Insights
            </h1>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Career advice, salary expectations, and workplace insights for healthcare
              professionals in Kenya.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <FullPageLoader />
            ) : error ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Articles are currently unavailable
                </h2>
                <p className="text-muted-foreground">
                  We couldn't load the latest articles right now. Please check back soon.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </div>
            ) : !articles || articles.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  No articles published yet
                </h2>
                <p className="text-muted-foreground">
                  Check back soon — we're working on new healthcare career articles.
                </p>
              </div>
            ) : (
              <div className="space-y-14">
                {articles[0] && (
                  <section>
                    <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground">Featured article</h2>
                    <ArticleCard
                      key={articles[0].slug}
                      title={articles[0].title}
                      slug={articles[0].slug}
                      excerpt={articles[0].excerpt}
                      category={articles[0].category?.name ?? null}
                      publishedAt={articles[0].publishedAt}
                      author={articles[0].author?.name ?? null}
                      imageUrl={getCmsImageUrl(articles[0].featuredImage, "large")}
                      href={`/blog/${articles[0].slug}`}
                      ctaLabel="Read article"
                      featured
                    />
                  </section>
                )}

                {articles.length > 1 && (
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-6">Latest articles</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {articles.slice(1).map((article) => (
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
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
