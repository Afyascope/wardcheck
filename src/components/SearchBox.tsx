import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchHospitals } from "@/hooks/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { getReportBadgeClasses } from "@/lib/utils";

type SearchBoxProps = {
  variant?: "search" | "filter";
  value?: string;
  onFilter?: (value: string) => void;
};

export function SearchBox({ variant = "search", value, onFilter }: SearchBoxProps) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const isFilter = variant === "filter";
  const [internalQuery, setInternalQuery] = useState("");
  const query = isFilter ? (value ?? "") : internalQuery;
  const debouncedQuery = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: hospitals } = useSearchHospitals(
    { q: debouncedQuery, limit: 5 },
    {
      query: {
        enabled: !isFilter && debouncedQuery.length > 1,
        queryKey: ["search-hospitals-nav", debouncedQuery],
      },
    }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateQuery = (next: string) => {
    if (isFilter) {
      onFilter?.(next);
    } else {
      setInternalQuery(next);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFilter) return;
    if (query.trim()) {
      const params = new URLSearchParams(searchString);
      params.set("q", query.trim());
      setLocation(`/search?${params.toString()}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              updateQuery(e.target.value);
              if (!isFilter) setIsOpen(true);
            }}
            onFocus={() => !isFilter && setIsOpen(true)}
            placeholder={
              isFilter
                ? "Filter by facility name, county, or level..."
                : "Search by facility name, county, or registration..."
            }
            className={`w-full h-14 pl-12 text-lg rounded-full border-2 border-primary/20 focus-visible:border-primary shadow-sm bg-white ${
              isFilter ? "pr-14" : "pr-4"
            }`}
          />
          {isFilter ? (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => updateQuery("")}
              disabled={!query}
              className="absolute right-3 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="absolute right-2 px-4 h-10 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          )}
        </div>
      </form>

      {!isFilter && isOpen && debouncedQuery.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
          {hospitals && hospitals.length > 0 ? (
            <ul className="py-2">
              {hospitals.map(h => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex flex-col gap-0.5"
                    onClick={() => {
                      setLocation(`/facility/${h.slug}`);
                      setIsOpen(false);
                      setInternalQuery("");
                    }}
                  >
                    <div className="font-semibold text-foreground">{h.facilityName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{h.county} County • {h.level}</span>
                      <span className={getReportBadgeClasses(h.reportsReceived)}>
                        {h.reportsReceived} report{h.reportsReceived !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              <li className="border-t mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full text-left px-4 py-2 text-sm text-primary font-medium hover:bg-primary/5"
                >
                  See all results for "{query}"
                </button>
              </li>
            </ul>
          ) : (
             <div className="p-4 text-center text-muted-foreground">
               No facilities found matching "{query}"
             </div>
          )}
        </div>
      )}
    </div>
  );
}
