import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBox } from "@/components/SearchBox";
import { ReportedFacilitiesTable } from "@/components/ReportedFacilitiesTable";
import { useReportedFacilities } from "@/hooks/api-client";
import { FullPageLoader } from "@/components/ui/loaders";
import { AlertTriangle } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

export default function ReportedFacilities() {
  const { data: facilities, isLoading } = useReportedFacilities();
  const [query, setQuery] = useState("");

  useSeo({
    title: "Facilities with Reports — WardCheck",
    description:
      "Browse Kenya healthcare facilities that have received verified workplace reports. Review report counts and the most common concerns before choosing your next employer.",
    path: "/reported-facilities",
  });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return facilities ?? [];
    return (facilities ?? []).filter(
      (f) =>
        f.facilityName.toLowerCase().includes(term) ||
        f.county.toLowerCase().includes(term) ||
        f.level.toLowerCase().includes(term),
    );
  }, [facilities, query]);

  return (
    <AppLayout>
      <div className="bg-muted/20 border-b py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Facilities with Reports</h1>
          <SearchBox variant="filter" value={query} onFilter={setQuery} />
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {isLoading ? (
          <FullPageLoader />
        ) : filtered.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                View facilities with workplace reports.
              </p>
            </div>
            <ReportedFacilitiesTable facilities={filtered} />
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No facilities found</h3>
            <p className="text-muted-foreground">
              {query.trim()
                ? `No reported facilities match "${query}".`
                : "There are no reported facilities yet."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
