import { useEffect, useMemo } from "react";
import { trackEvent } from "@/lib/analytics";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBox } from "@/components/SearchBox";
import { ReportedFacilitiesTable } from "@/components/ReportedFacilitiesTable";
import { useSearchHospitals } from "@/hooks/api-client";
import { useSearch, Link } from "wouter";
import { FullPageLoader } from "@/components/ui/loaders";
import { Building2, AlertTriangle, ChevronRight } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { cn, getReportBadgeClasses } from "@/lib/utils";
import type { HospitalSearchResult } from "@/types/api";

export default function Search() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const q = searchParams.get("q") || "";
  const filter = searchParams.get("filter") || "";
  const sort = searchParams.get("sort") || "";

  const viewTitle =
    filter === "reported"
      ? "Facilities with Reports"
      : filter === "no-reports"
        ? "Facilities with Zero Reports"
        : sort === "recent-reports"
          ? "Total Reports Received"
          : "";

  const viewDescription =
    filter === "reported"
      ? "View facilities with workplace reports."
      : filter === "no-reports"
        ? "Browse facilities with no reports."
        : sort === "recent-reports"
          ? "Explore recently reported facilities."
          : "";

  const { data: hospitals, isLoading } = useSearchHospitals(
    { q, limit: 50 },
    { query: { enabled: !!q, queryKey: ["search-hospitals-page", q] } }
  );

  const results = useMemo(() => {
    let list = hospitals ?? [];
    if (filter === "reported") {
      list = list.filter((h: HospitalSearchResult) => h.reportsReceived > 0);
    } else if (filter === "no-reports") {
      list = list.filter((h: HospitalSearchResult) => h.reportsReceived === 0);
    }
    if (sort === "recent-reports") {
      list = [...list].sort(
        (a, b) => b.reportsReceived - a.reportsReceived || a.facilityName.localeCompare(b.facilityName)
      );
    }
    return list;
  }, [hospitals, filter, sort]);

  useSeo({
    title: viewTitle
      ? `${viewTitle} — Search Healthcare Facilities | WardCheck`
      : q
        ? `"${q}" — Search Healthcare Facilities | WardCheck`
        : "Search Healthcare Facilities | WardCheck",
    description:
      "Search Kenya's registered healthcare facilities by name, county, or type. Find workplace transparency data before choosing your next employer.",
    path: "/search",
  });

  useEffect(() => {
    if (!q || isLoading || !hospitals) return;

    trackEvent("facility_searched", {
      search_term: q,
      results_count: hospitals.length,
      has_results: hospitals.length > 0,
    });
  }, [q, hospitals, isLoading]);

  return (
    <AppLayout>
      <div className="bg-muted/20 border-b py-8">
        <div className={cn("mx-auto px-4", filter === "reported" ? "max-w-6xl" : "max-w-4xl")}>
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            {viewTitle || "Search Facilities"}
          </h1>
          <SearchBox />
        </div>
      </div>

      <div
        className={cn(
          "flex-1 w-full mx-auto px-4 py-8",
          filter === "reported" ? "max-w-6xl" : "max-w-4xl",
        )}
      >
        {viewTitle && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{viewDescription}</p>
            </div>
            <Link
              href="/search"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all facilities
            </Link>
          </div>
        )}

        {!q ? (
          <div className="text-center text-muted-foreground py-12">
            {viewTitle ? (
              <>
                <p className="text-lg font-semibold text-foreground mb-2">{viewTitle}</p>
                <p className="text-sm">{viewDescription}</p>
                <p className="mt-4">Use the search box above to explore facilities.</p>
              </>
            ) : (
              "Enter a search query to find health facilities."
            )}
          </div>
        ) : isLoading ? (
          <FullPageLoader />
        ) : filter === "reported" ? (
          results.length > 0 ? (
            <ReportedFacilitiesTable facilities={results} />
          ) : (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No reported facilities found</h3>
              <p className="text-muted-foreground">
                We couldn't find any facilities with reports matching "{q}".
              </p>
            </div>
          )
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              {results.length} result{results.length !== 1 && "s"} for "{q}"
            </h2>
            {results.map(facility => (
              <Link key={facility.id} href={`/facility/${facility.slug}`}>
                <div className="group border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      {facility.facilityName}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{facility.county} County</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{facility.ownership}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{facility.level}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                    <span className={getReportBadgeClasses(facility.reportsReceived)}>
                      {facility.reportsReceived === 0 ? "0 reports" : `${facility.reportsReceived} report${facility.reportsReceived > 1 ? 's' : ''}`}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No facilities found</h3>
            <p className="text-muted-foreground">We couldn't find any facilities matching "{q}".</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
