import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReportBadgeClasses } from "@/lib/utils";
import type { ReportedFacility } from "@/types/api";

const PAGE_SIZE = 25;

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

function reportCountLabel(count: number) {
  return `${count} report${count > 1 ? "s" : ""}`;
}

export function ReportedFacilitiesTable({ facilities }: { facilities: ReportedFacility[] }) {
  const [, navigate] = useLocation();

  const sorted = useMemo(() => {
    return [...facilities].sort((a, b) => {
      if (b.reportsReceived !== a.reportsReceived) {
        return b.reportsReceived - a.reportsReceived;
      }
      const aUp = a.lastUpdated ?? "";
      const bUp = b.lastUpdated ?? "";
      if (aUp && bUp && aUp !== bUp) {
        return bUp.localeCompare(aUp);
      }
      return a.facilityName.localeCompare(b.facilityName);
    });
  }, [facilities]);

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const start = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, sorted.length);

  useEffect(() => {
    setPage(1);
  }, [facilities]);

  return (
    <div>
      <div className="hidden md:block border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Facility</TableHead>
              <TableHead>County</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Most Common Concern</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((f) => (
              <TableRow
                key={f.id}
                onClick={() => navigate(`/facility/${f.slug}`)}
                className="cursor-pointer"
              >
                <TableCell className="py-3">
                  <Link
                    href={`/facility/${f.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {f.facilityName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{f.county}</TableCell>
                <TableCell className="text-muted-foreground">{f.level}</TableCell>
                <TableCell>
                  <span className={getReportBadgeClasses(f.reportsReceived)}>
                    {reportCountLabel(f.reportsReceived)}
                  </span>
                </TableCell>
                <TableCell>
                  <ConcernBadge concern={f.mostCommonConcern ?? null} />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/facility/${f.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View ${f.facilityName}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="md:hidden space-y-3">
        {pageItems.map((f) => (
          <li key={f.id}>
            <Link
              href={`/facility/${f.slug}`}
              className="block border rounded-xl bg-card p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground">{f.facilityName}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {f.county} • {f.level}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={getReportBadgeClasses(f.reportsReceived)}>
                  {reportCountLabel(f.reportsReceived)}
                </span>
                <ConcernBadge concern={f.mostCommonConcern ?? null} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {sorted.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {start}–{end} of {sorted.length} facilities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
