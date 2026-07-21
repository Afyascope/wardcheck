import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBox } from "@/components/SearchBox";
import { useSearchHospitals } from "@/hooks/api-client";
import { useSearch, Link } from "wouter";
import { FullPageLoader } from "@/components/ui/loaders";
import { Building2, AlertTriangle, FileText, ChevronRight } from "lucide-react";

export default function Search() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const q = searchParams.get("q") || "";

  const { data: hospitals, isLoading } = useSearchHospitals(
    { q, limit: 50 },
    { query: { enabled: !!q, queryKey: ["search-hospitals-page", q] } }
  );
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
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Search Facilities</h1>
          <SearchBox />
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {!q ? (
          <div className="text-center text-muted-foreground py-12">
            Enter a search query to find health facilities.
          </div>
        ) : isLoading ? (
          <FullPageLoader />
        ) : hospitals && hospitals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              {hospitals.length} result{hospitals.length !== 1 && "s"} for "{q}"
            </h2>
            {hospitals.map(facility => (
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
                    <div className="flex flex-col md:items-end">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${facility.reportsReceived > 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                        {facility.reportsReceived === 0 ? "0 reports" : `${facility.reportsReceived} report${facility.reportsReceived > 1 ? 's' : ''}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {facility.reportsReceived === 0 ? "No workplace reports submitted" : "Workplace reports received"}
                      </div>
                    </div>
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
