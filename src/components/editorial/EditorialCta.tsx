import { ArrowRight, Flag, Search } from "lucide-react";
import { Link } from "wouter";

export function EditorialCta() {
  return (
    <section className="border-t border-border/60 pt-10">
      <div className="rounded-lg border bg-primary/5 p-6 sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Know your next employer.</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Search a healthcare facility before accepting your next job.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Search className="h-4 w-4" />
            Search Facilities
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Flag className="h-4 w-4" />
            Report a Facility
          </Link>
        </div>
      </div>
    </section>
  );
}
