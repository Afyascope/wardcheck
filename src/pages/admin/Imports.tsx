import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListImportHistory,
  useGetImportDetail,
  useGetImportErrors,
  useGetImportSummary,
  useStartKmpdcSync,
  useRetryKmpdcImport,
} from "@/hooks/api-client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSeo } from "@/hooks/use-seo";
import { FullPageLoader } from "@/components/ui/loaders";
import { Loader2, RefreshCw, Eye, AlertCircle } from "lucide-react";

export default function AdminImports() {
  useSeo({
    title: "KMPDC Import History | WardCheck Admin",
    description: "WardCheck admin KMPDC import management.",
    path: "/admin/imports",
    robots: "noindex,nofollow",
  });

  const { data: history, isLoading } = useListImportHistory({ limit: 50 });
  const startSync = useStartKmpdcSync();
  const retryImport = useRetryKmpdcImport();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail } = useGetImportDetail(selectedId!, { query: { enabled: !!selectedId } });
  const { data: errors } = useGetImportErrors(selectedId!, { query: { enabled: !!selectedId } });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">KMPDC Import History</h1>
        <Button onClick={() => startSync.mutateAsync({})} disabled={startSync.isPending}>
          {startSync.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Start New Sync
        </Button>
      </div>

      {isLoading ? (
        <FullPageLoader />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Fetched</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Duplicates</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.items.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm">{new Date(h.startedAt).toLocaleString()}</TableCell>
                  <TableCell>{h.duration ? `${h.duration}s` : "-"}</TableCell>
                  <TableCell>{h.recordsFetched}</TableCell>
                  <TableCell>{h.imported}</TableCell>
                  <TableCell>{h.updated}</TableCell>
                  <TableCell>{h.duplicates}</TableCell>
                  <TableCell>{h.failed}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      h.status === "completed" ? "bg-green-100 text-green-700" :
                      h.status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {h.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(h.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {h.status === "failed" && (
                        <Button size="sm" variant="outline" onClick={() => retryImport.mutate({ historyId: h.id })}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Details #{selectedId}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Status:</strong> {detail.status}</div>
                <div><strong>Duration:</strong> {detail.duration ?? "-"}s</div>
                <div><strong>Records Fetched:</strong> {detail.recordsFetched}</div>
                <div><strong>Imported:</strong> {detail.imported}</div>
                <div><strong>Updated:</strong> {detail.updated}</div>
                <div><strong>Duplicates:</strong> {detail.duplicates}</div>
                <div><strong>Skipped:</strong> {detail.skipped}</div>
                <div><strong>Failed:</strong> {detail.failed}</div>
                <div><strong>Trigger:</strong> {detail.trigger}</div>
              </div>
              {detail.errorMessage && (
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {detail.errorMessage}
                </div>
              )}
              {errors && errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Errors ({errors.length})</h3>
                  <div className="max-h-60 overflow-auto space-y-2">
                    {errors.map((e) => (
                      <div key={e.id} className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">{e.stage}{e.source ? ` — ${e.source}` : ""}</div>
                        <div className="text-muted-foreground">{e.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
