import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminReports, useApproveReport, useRejectReport, ReportStatus } from "@/hooks/api-client";
import type { ReportStatusValue } from "@/hooks/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeo } from "@/hooks/use-seo";
import { FullPageLoader } from "@/components/ui/loaders";
import { CheckCircle2, XCircle } from "lucide-react";

export default function AdminReports() {
  useSeo({
    title: "Manage Reports | WardCheck Admin",
    description: "WardCheck admin reports management.",
    path: "/admin/reports",
    robots: "noindex,nofollow",
  });

  const [statusFilter, setStatusFilter] = useState<ReportStatusValue | "all">("pending");
  const { data: reports, isLoading } = useListAdminReports({ status: statusFilter === "all" ? undefined : statusFilter, pageSize: 100 });
  const approve = useApproveReport();
  const reject = useRejectReport();

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatusValue | "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <FullPageLoader />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.facilityName}</TableCell>
                  <TableCell>{r.county}</TableCell>
                  <TableCell>{r.jobCategory}</TableCell>
                  <TableCell>{r.employmentYear}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === "approved" ? "bg-green-100 text-green-700" :
                      r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => approve.mutate({ id: r.id })} disabled={r.status !== "pending"}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => reject.mutate({ id: r.id })} disabled={r.status !== "pending"}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
