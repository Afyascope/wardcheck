import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminReports, useApproveReport, useRejectReport, ReportStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminReports() {
  const [status, setStatus] = useState<ReportStatus | undefined>(ReportStatus.pending);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: pageData, isLoading } = useListAdminReports(
    { status, page, pageSize: 20 },
    { query: { queryKey: ["admin-reports", status, page] } }
  );

  const approveMutation = useApproveReport();
  const rejectMutation = useRejectReport();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const exportUrl = `${import.meta.env.BASE_URL}api/admin/reports/export`;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <Button asChild variant="outline">
          <a href={exportUrl} download>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
          <Tabs 
            value={status === undefined ? "all" : status} 
            onValueChange={(v) => { setStatus(v === "all" ? undefined : v as ReportStatus); setPage(1); }}
          >
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-sm text-muted-foreground">
            {pageData ? `Showing ${pageData.items.length} of ${pageData.total}` : ""}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : pageData?.items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No reports found.</TableCell></TableRow>
            ) : (
              pageData?.items.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(r.submittedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{r.facilityName}</div>
                    <div className="text-xs text-muted-foreground">{r.county}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.reason}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.jobCategory} ({r.employmentYear})</div>
                    {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${r.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                      ${r.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {r.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => approveMutation.mutate({ id: r.id }, { onSuccess: () => invalidate() })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => rejectMutation.mutate({ id: r.id }, { onSuccess: () => invalidate() })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pageData && pageData.total > pageData.pageSize && (
          <div className="p-4 border-t flex justify-end gap-2 bg-muted/5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageData.pageSize >= pageData.total}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
