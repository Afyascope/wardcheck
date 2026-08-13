import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSeo } from "@/hooks/use-seo";

export function NotFoundPage() {
  useSeo({
    title: "Page Not Found | WardCheck",
    description: "The page you are looking for does not exist or has been moved.",
    path: "/404",
    robots: "noindex,follow",
  });

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <h1 className="text-5xl font-bold tracking-tight">404</h1>
          <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
            If you entered the address manually, please check the URL and try again.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
            >
              Return Home
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-muted transition"
            >
              Search Facilities
            </Link>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Need help?{" "}
            <a
              href="mailto:support@wardcheck.co.ke"
              className="text-primary hover:underline"
            >
              support@wardcheck.co.ke
            </a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
