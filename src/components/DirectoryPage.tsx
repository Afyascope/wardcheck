import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SearchBox } from "@/components/SearchBox";
import { DirectoryTable } from "@/components/DirectoryTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFacilitiesDirectory, useFacilityFilters } from "@/hooks/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { useSeo } from "@/hooks/use-seo";
import { SlidersHorizontal, X } from "lucide-react";
import { FACILITY_SORT_VALUES, type FacilitySortValue } from "@/types/api";

const PAGE_SIZE = 25;

const SORT_LABELS: Record<FacilitySortValue, string> = {
  alphabetical: "Alphabetical",
  "most-reports": "Most Reports",
  newest: "Newest",
  "recently-updated": "Recently Updated",
};

type DirectoryPageProps = {
  filter?: "reported" | "no-reports";
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoPath: string;
  variant?: "directory" | "reported";
  showFacets?: boolean;
};

export function DirectoryPage({
  filter,
  title,
  description,
  seoTitle,
  seoDescription,
  seoPath,
  variant = "directory",
  showFacets = true,
}: DirectoryPageProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [county, setCounty] = useState("");
  const [ownership, setOwnership] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState<FacilitySortValue>("alphabetical");

  const hasActiveFilters = Boolean(county || ownership || level || sort !== "alphabetical");

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, county, ownership, level, sort]);

  const { data, isLoading, isFetching } = useFacilitiesDirectory({
    filter,
    q: debouncedQuery.trim() || undefined,
    county: county || undefined,
    ownership: ownership || undefined,
    level: level || undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: filterOptions } = useFacilityFilters();

  useSeo({
    title: seoTitle,
    description: seoDescription,
    path: seoPath,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const clearFilters = () => {
    setCounty("");
    setOwnership("");
    setLevel("");
    setSort("alphabetical");
  };

  return (
    <AppLayout>
      <div className="bg-muted/20 border-b py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {isLoading && total === 0 ? (
                "Loading…"
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {total.toLocaleString()}
                  </span>{" "}
                  {total === 1 ? "facility" : "facilities"}
                </>
              )}
            </div>
          </div>
          <SearchBox variant="filter" value={query} onFilter={setQuery} />
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {showFacets && (
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground mt-2.5 hidden sm:block" />
            <Select value={county || undefined} onValueChange={setCounty}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                {(filterOptions?.counties ?? []).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ownership || undefined} onValueChange={setOwnership}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Ownership Types" />
              </SelectTrigger>
              <SelectContent>
                {(filterOptions?.ownerships ?? []).map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level || undefined} onValueChange={setLevel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                {(filterOptions?.levels ?? []).map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as FacilitySortValue)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACILITY_SORT_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline h-9"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        )}

        <DirectoryTable
          items={items}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          isLoading={isLoading}
          variant={variant}
        />
        {isFetching && total > 0 && (
          <p className="mt-4 text-xs text-muted-foreground text-center">Updating results…</p>
        )}
      </div>
    </AppLayout>
  );
}
