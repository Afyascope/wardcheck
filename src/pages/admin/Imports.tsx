import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListImportHistory,
  useGetImportDetail,
  useGetImportErrors,
  useStartKmpdcSync,
  useRetryKmpdcImport,
} from "@/hooks/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Play, RefreshCw, AlertTriangle, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
    case "COMPLETED_WITH_ERRORS":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3" /> Errors</span>;
    case "RUNNING":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>;
    case "FAILED":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Failed</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3" /> {status}</span>;
  }
}

function ImportDetailDialog({ importId, onClose }: { importId: number | null; onClose: () => void }) {
  const { data: detail, isLoading: loadingDetail } = useGetImportDetail(importId, {
    query: { enabled: importId !== null, refetchInterval: (q) => q.state.data?.status === "RUNNING" ? 3000 : false },
  });
  const { data: errorsData, isLoading: loadingErrors } = useGetImportErrors(importId, undefined, {
    query: { enabled: importId !== null && detail != null && detail.failed > 0 },
  });
  const [errorPage, setErrorPage] = useState(1);

  if (importId === null) return null;

  return (
    <Dialog open={importId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import #{importId} Details</DialogTitle>
        </DialogHeader>
        {loadingDetail ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1">{statusBadge(detail.status)}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Trigger</div>
                <div className="mt-1 text-sm font-medium">{detail.trigger}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="mt-1 text-sm font-medium">{formatDuration(detail.duration)}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Started</div>
                <div className="mt-1 text-sm font-medium">{detail.startedAt ? format(new Date(detail.startedAt), "MMM d, HH:mm") : "—"}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Fetched", value: detail.recordsFetched, color: "text-foreground" },
                { label: "Imported", value: detail.imported, color: "text-green-600" },
                { label: "Updated", value: detail.updated, color: "text-blue-600" },
                { label: "Duplicates", value: detail.duplicates, color: "text-amber-600" },
                { label: "Skipped", value: detail.skipped, color: "text-muted-foreground" },
                { label: "Failed", value: detail.failed, color: "text-red-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-muted/20 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
            {detail.errorMessage && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="text-sm font-medium text-destructive">Error</div>
                <div className="text-sm text-destructive/80 mt-1">{detail.errorMessage}</div>
              </div>
            )}
            {detail.failed > 0 && errorsData && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Failed Records</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorsData.items.map((err) => (
                      <TableRow key={err.id}>
                        <TableCell className="text-xs">{err.stage}</TableCell>
                        <TableCell className="text-xs">{err.source ?? "—"}</TableCell>
                        <TableCell className="text-xs">{err.message}</TableCell>
                      </TableRow>
                    ))}
                    {errorsData.items.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-4">No errors recorded.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                {errorsData.total > errorsData.pageSize && (
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => setErrorPage(p => Math.max(1, p - 1))} disabled={errorPage === 1}>
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">Page {errorPage} of {Math.ceil(errorsData.total / errorsData.pageSize)}</span>
                    <Button variant="outline" size="sm" onClick={() => setErrorPage(p => p + 1)} disabled={errorPage * errorsData.pageSize >= errorsData.total}>
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">Import not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminImports() {
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useListImportHistory(
    { page, pageSize: 15 },
    { query: { queryKey: ["import-history", page, 15] } },
  );

  const syncMutation = useStartKmpdcSync();
  const retryMutation = useRetryKmpdcImport();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["import-history"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: ["import-history"] });
      },
    });
  };

  const handleRetry = (id: number) => {
    retryMutation.mutate({ id }, {
      onSuccess: () => {
        invalidate();
        setDetailId(id);
      },
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">KMPDC Import</h1>
          <p className="text-muted-foreground mt-1">Synchronize facility data from the Kenya Medical Practitioners and Dentists Council</p>
        </div>
        <Button onClick={handleSync} disabled={syncMutation.isPending}>
          {syncMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Start Sync
        </Button>
      </div>

      {syncMutation.isError && (
        <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Sync failed: {syncMutation.error instanceof Error ? syncMutation.error.message : "Unknown error"}
        </div>
      )}
      {syncMutation.isSuccess && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Sync started successfully. The import is running in the background.
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/5">
          <div className="text-sm font-medium text-muted-foreground">Import History</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Fetched</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Duplicates</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : history?.items.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No imports yet. Click "Start Sync" to begin.</TableCell></TableRow>
            ) : (
              history?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setDetailId(item.id)}
                >
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.startedAt ? format(new Date(item.startedAt), "MMM d, yyyy HH:mm") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{formatDuration(item.duration)}</TableCell>
                  <TableCell className="text-sm font-medium">{item.recordsFetched.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-green-600 font-medium">{item.imported.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-blue-600">{item.updated.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-amber-600">{item.duplicates.toLocaleString()}</TableCell>
                  <TableCell className={`text-sm font-medium ${item.failed > 0 ? "text-red-600" : ""}`}>{item.failed.toLocaleString()}</TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {item.failed > 0 && item.status !== "RUNNING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleRetry(item.id)}
                        disabled={retryMutation.isPending}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {history && history.total > history.pageSize && (
          <div className="p-4 border-t flex justify-end gap-2 bg-muted/5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * history.pageSize >= history.total}>Next</Button>
          </div>
        )}
      </div>

      <ImportDetailDialog importId={detailId} onClose={() => setDetailId(null)} />
    </AdminLayout>
  );
}
