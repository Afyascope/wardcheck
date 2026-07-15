import { AppLayout } from "@/components/layout/AppLayout";
import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { FullPageLoader } from "@/components/ui/loaders";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useSeo } from "@/hooks/use-seo";

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { data: post, isLoading, error } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) },
  });

  useSeo({
    title: post ? `${post.seoTitle} | WardCheck Blog` : "Blog | WardCheck",
    description: post?.metaDescription ?? "Healthcare careers and employment rights guides from WardCheck.",
    path: `/blog/${slug}`,
    type: "article",
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.metaDescription,
          datePublished: post.publishedAt,
          image: post.featuredImageUrl ?? undefined,
          articleSection: post.category,
        }
      : undefined,
  });

  return (
    <AppLayout>
      <div className="flex-1 bg-muted/10 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to blog
          </Link>

          {isLoading ? (
            <FullPageLoader />
          ) : error || !post ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Article not found</h2>
              <p className="text-muted-foreground">We couldn't find this blog post.</p>
            </div>
          ) : (
            <>
              <article className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                {post.featuredImageUrl && (
                  <img src={post.featuredImageUrl} alt={post.title} className="w-full h-64 object-cover" />
                )}
                <div className="p-8">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
                    {post.category}
                  </span>
                  <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">{post.title}</h1>
                  <div className="text-sm text-muted-foreground mb-8">
                    {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                  </div>
                  <div className="prose prose-slate max-w-none whitespace-pre-line text-foreground/90 leading-relaxed">
                    {post.content}
                  </div>
                  {post.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              {post.relatedArticles.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold mb-4">Related Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {post.relatedArticles.map((related) => (
                      <Link key={related.id} href={`/blog/${related.slug}`}>
                        <div className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-card h-full">
                          <div className="font-semibold text-foreground text-sm">{related.title}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {format(new Date(related.publishedAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
