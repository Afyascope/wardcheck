import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { useSeo } from "@/hooks/use-seo";

export default function BlogPost() {
  useSeo({
    title: "Blog | WardCheck",
    description: "WardCheck blog — coming soon.",
    path: "/blog",
    robots: "noindex,follow",
  });

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <h1 className="text-5xl font-bold tracking-tight">Coming Soon</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The WardCheck blog is not yet available. Check back later for healthcare career guides and workplace insights.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
