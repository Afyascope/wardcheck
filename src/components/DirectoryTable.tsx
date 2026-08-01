import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReportBadgeClasses } from "@/lib/utils";
import type { FacilityDirectoryItem } from "@/types/api";

type DirectoryVariant = "directory" | "reported";

type DirectoryTableProps = {
  items: FacilityDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  variant?: DirectoryVariant;
  emptyTitle?: string;
  emptyMessage?: string;
};

function ConcernBadge({ concern }: { concern?: string | null }) {
  if (!concern) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        No common concern yet
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      {concern}
    </span>
  );
}

function StatusBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      Has Reports
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      No Reports
    </span>
  );
}

function reportCountLabel(count: number) {
  return `${count} report${count > 1 ? "s" : ""}`;
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <div className="h-4 rounded bg-muted animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-16">
      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function DirectoryTable({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  variant = "directory",
  emptyTitle = "No facilities found",
  emptyMessage = "No facilities match your search.",
}: DirectoryTableProps) {
  const [, navigate] = useLocation();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const isReported = variant === "reported";

  const rowClasses = "cursor-pointer hover:bg-muted/50 transition-colors";

  return (
    <div>
      <div className="hidden md:block border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Facility</TableHead>
              <TableHead>County</TableHead>
              <TableHead>Level</TableHead>
              {variant === "directory" && <TableHead>Ownership</TableHead>}
              <TableHead>Reports</TableHead>
              {isReported ? (
                <>
                  <TableHead>Most Common Concern</TableHead>
                  <TableHead>Last Updated</TableHead>
                </>
              ) : (
                <TableHead>Status</TableHead>
              )}
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && items.length === 0 ? (
              <SkeletonRows rows={pageSize} />
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              items.map((f) => (
                <TableRow key={f.id} onClick={() => navigate(`/facility/${f.slug}`)} className={rowClasses}>
                  <TableCell className="py-3">
                    <span
                      role="link"
                      tabIndex={0}
                      className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none focus:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/facility/${f.slug}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/facility/${f.slug}`);
                        }
                      }}
                    >
                      {f.facilityName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.county}</TableCell>
                  <TableCell className="text-muted-foreground">{f.level}</TableCell>
                  {variant === "directory" && (
                    <TableCell className="text-muted-foreground">{f.ownership}</TableCell>
                  )}
                  <TableCell>
                    <span className={getReportBadgeClasses(f.reportsReceived)}>
                      {reportCountLabel(f.reportsReceived)}
                    </span>
                  </TableCell>
                  {isReported ? (
                    <>
                      <TableCell>
                        <ConcernBadge concern={f.mostCommonConcern ?? null} />
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatUpdatedAt(f.lastUpdated)}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      <StatusBadge count={f.reportsReceived} />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <span
                      role="link"
                      tabIndex={0}
                      aria-label={`View ${f.facilityName}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer focus:outline-none focus:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/facility/${f.slug}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/facility/${f.slug}`);
                        }
                      }}
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ul className="md:hidden space-y-3">
        {isLoading && items.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <div className="border rounded-xl bg-card p-4">
                  <div className="h-4 rounded bg-muted animate-pulse w-1/2 mb-3" />
                  <div className="h-3 rounded bg-muted animate-pulse w-2/3" />
                </div>
              </li>
            ))
          : items.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/facility/${f.slug}`)}
                  className="block w-full text-left border rounded-xl bg-card p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{f.facilityName}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {f.county} • {f.level}
                        {variant === "directory" && ` • ${f.ownership}`}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={getReportBadgeClasses(f.reportsReceived)}>
                      {reportCountLabel(f.reportsReceived)}
                    </span>
                    {isReported ? (
                      <ConcernBadge concern={f.mostCommonConcern ?? null} />
                    ) : (
                      <StatusBadge count={f.reportsReceived} />
                    )}
                  </div>
                </button>
              </li>
            ))}
      </ul>

      {total === 0 && items.length === 0 && !isLoading && (
        <div className="md:hidden">
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {start}–{end} of {total.toLocaleString()} facilities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
