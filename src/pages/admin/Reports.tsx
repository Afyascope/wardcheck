import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminReports,
  useApproveReport,
  useRejectReport,
  useUpdateAdminReport,
  useDeleteAdminReport,
  useFacilityFilters,
  JobCategory,
  type ReportStatusValue,
  type ReportSourceValue,
} from "@/hooks/api-client";
import type { AdminReportItem } from "@/types/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useSeo } from "@/hooks/use-seo";
import { FullPageLoader } from "@/components/ui/loaders";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/api/client";
import {
  AdminReportFields,
  adminReportValuesFromItem,
  adminReportValuesToInput,
  useAdminReportForm,
  type AdminReportFormValues,
} from "@/components/admin/AdminReportFields";
import { useDebounce } from "@/hooks/use-debounce";
import { CheckCircle2, XCircle, Pencil, Trash2, Loader2 } from "lucide-react";

function statusBadge(status: string) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize";
  switch (status) {
    case "approved":
      return <span className={`${base} bg-green-100 text-green-700`}>Approved</span>;
    case "rejected":
      return <span className={`${base} bg-destructive/10 text-destructive`}>Rejected</span>;
    default:
      return <span className={`${base} bg-amber-100 text-amber-700`}>Pending</span>;
  }
}

function sourceBadge(source: string) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase";
  if (source === "admin") {
    return <span className={`${base} bg-violet-100 text-violet-700`}>Admin</span>;
  }
  return <span className={`${base} bg-slate-100 text-slate-700`}>Public</span>;
}

type Filters = {
  status: ReportStatusValue | "all";
  source: ReportSourceValue | "all";
  facility: string;
  county: string;
  category: string;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_FILTERS: Filters = {
  status: "pending",
  source: "all",
  facility: "",
  county: "",
  category: "",
  dateFrom: "",
  dateTo: "",
};

function EditReportDialog({
  report,
  onClose,
}: {
  report: AdminReportItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const update = useUpdateAdminReport();
  const form = useAdminReportForm(adminReportValuesFromItem(report));

  const onSubmit = async (values: AdminReportFormValues) => {
    try {
      await update.mutateAsync({ id: report.id, data: adminReportValuesToInput(values) });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Report updated", description: "The changes have been saved." });
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.body : "We could not update this report.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Report #{report.id}</DialogTitle>
          <DialogDescription>
            Update the report details. It remains publicly approved after saving.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AdminReportFields form={form} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteReportDialog({
  report,
  onClose,
}: {
  report: AdminReportItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const remove = useDeleteAdminReport();

  const onDelete = async () => {
    try {
      await remove.mutateAsync({ id: report.id });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-reports-analytics"] });
      toast({ title: "Report deleted", description: "The report and its statistics have been removed." });
      onClose();
    } catch (error) {
      const message = error instanceof ApiError ? error.body : "We could not delete this report.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Report #{report.id}</DialogTitle>
          <DialogDescription>
            This permanently removes the report and recalculates facility statistics. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminReports() {
  useSeo({
    title: "Manage Reports | WardCheck Admin",
    description: "WardCheck admin reports management.",
    path: "/admin/reports",
    robots: "noindex,nofollow",
  });

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [editing, setEditing] = useState<AdminReportItem | null>(null);
  const [deleting, setDeleting] = useState<AdminReportItem | null>(null);

  const debouncedFacility = useDebounce(filters.facility, 300);
  const effectiveFilters = { ...filters, facility: debouncedFacility };

  const { data: reports, isLoading } = useListAdminReports({
    status: effectiveFilters.status === "all" ? undefined : effectiveFilters.status,
    source: effectiveFilters.source === "all" ? undefined : effectiveFilters.source,
    facility: effectiveFilters.facility || undefined,
    county: effectiveFilters.county || undefined,
    category: effectiveFilters.category || undefined,
    dateFrom: effectiveFilters.dateFrom || undefined,
    dateTo: effectiveFilters.dateTo || undefined,
    pageSize: 100,
  });

  const { data: facilityFilters } = useFacilityFilters();
  const approve = useApproveReport();
  const reject = useRejectReport();

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-reports-analytics"] }),
    ]);
  };

  const handleApprove = async (id: number) => {
    await approve.mutateAsync({ id });
    await refreshQueries();
  };

  const handleReject = async (id: number) => {
    await reject.mutateAsync({ id });
    await refreshQueries();
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "" && value !== "all");

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <span className="text-sm text-muted-foreground">{reports?.total?.toLocaleString() ?? "-"} results</span>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v as Filters["status"] }))}>
              <SelectTrigger>
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select value={filters.source} onValueChange={(v) => setFilters((f) => ({ ...f, source: v as Filters["source"] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">County</label>
            <Select value={filters.county} onValueChange={(v) => setFilters((f) => ({ ...f, county: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="All counties" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="">All counties</SelectItem>
                {facilityFilters?.counties.map((county) => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={filters.category} onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="">All categories</SelectItem>
                {Object.values(JobCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Facility</label>
            <Input
              placeholder="Search facility..."
              value={filters.facility}
              onChange={(e) => setFilters((f) => ({ ...f, facility: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              disabled={!hasActiveFilters}
            >
              Reset
            </Button>
          </div>
        </div>
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
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-40">Actions</TableHead>
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
                  <TableCell>{sourceBadge(r.source)}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(r.id)} disabled={r.status !== "pending" || approve.isPending} title="Approve">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(r.id)} disabled={r.status !== "pending" || reject.isPending} title="Reject">
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(r)} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && <EditReportDialog report={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteReportDialog report={deleting} onClose={() => setDeleting(null)} />}
    </AdminLayout>
  );
}
