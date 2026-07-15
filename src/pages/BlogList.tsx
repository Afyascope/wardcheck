import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListBlogPosts } from "@workspace/api-client-react";
import { BlogCategory } from "@workspace/api-client-react";
import { Link } from "wouter";
import { FullPageLoader } from "@/components/ui/loaders";
import { format } from "date-fns";
import { useSeo } from "@/hooks/use-seo";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.values(BlogCategory);

export default function BlogList() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: posts, isLoading } = useListBlogPosts(
    { category: category as (typeof CATEGORIES)[number] | undefined, limit: 50 },
    { query: { queryKey: ["blog-posts", category] } },
  );

  useSeo({
    title: "Blog — WardCheck",
    description:
      "Guides on healthcare careers, employment rights, and hospital insights for healthcare workers in Kenya, plus updates on WardCheck's workplace transparency reports.",
    path: "/blog",
  });

  return (
    <AppLayout>
      <div className="bg-muted/20 border-b py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">WardCheck Blog</h1>
          <p className="text-muted-foreground">
            Guides on healthcare careers, employment rights, and hospital insights in Kenya.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategory(undefined)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
              !category ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground hover:border-primary/50",
            )}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                category === c ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground hover:border-primary/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <FullPageLoader />
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="group border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-card h-full flex flex-col">
                  {post.featuredImageUrl && (
                    <img src={post.featuredImageUrl} alt={post.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-flex self-start items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                      {post.category}
                    </span>
                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="mt-auto text-xs text-muted-foreground">
                      {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">No articles in this category yet.</div>
        )}
      </div>
    </AppLayout>
  );
}
