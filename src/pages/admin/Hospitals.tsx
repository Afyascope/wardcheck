import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminHospitals, useCreateHospital, useUpdateHospital, useDeleteHospital, useImportHospitals, Hospital } from "@/hooks/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Upload, Trash2, Pencil, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";

const hospitalSchema = z.object({
  facilityName: z.string().min(1, "Required"),
  county: z.string().min(1, "Required"),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  ownership: z.string().min(1, "Required"),
  level: z.string().min(1, "Required"),
  registrationNumber: z.string().optional(),
});

function ImportPanel({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number, updated: number, duplicatesDetected: number, errors: string[] } | null>(null);
  const importMutation = useImportHospitals();

  const handleImport = async () => {
    if (!file) return;
    setResult(null);
    try {
      const data = await importMutation.mutateAsync({ file });
      setResult(data);
      if (data.created > 0 || data.updated > 0) {
        onImportSuccess();
      }
    } catch (e) {
      console.error(e);
      setResult({ created: 0, updated: 0, duplicatesDetected: 0, errors: ["Upload failed"] });
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm mb-8">
      <h3 className="font-semibold mb-4 text-lg">Bulk Import Facilities</h3>
      <div className="flex items-center gap-4">
        <Input 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="max-w-sm"
        />
        <Button onClick={handleImport} disabled={!file || importMutation.isPending} className="whitespace-nowrap">
          {importMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Import CSV/Excel
        </Button>
      </div>
      {result && (
        <div className="mt-4 p-4 bg-muted/20 border rounded-lg text-sm">
          <p className="font-medium">Import complete:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-muted-foreground">
            <li>{result.created} created</li>
            <li>{result.updated} updated</li>
            <li>{result.duplicatesDetected} duplicates ignored</li>
          </ul>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 text-destructive">
              <p className="font-medium">Errors:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4 text-xs">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HospitalForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData?: Hospital, 
  onSubmit: (data: z.infer<typeof hospitalSchema>) => void,
  isLoading: boolean
}) {
  const form = useForm<z.infer<typeof hospitalSchema>>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: initialData ? {
      facilityName: initialData.facilityName,
      county: initialData.county,
      subCounty: initialData.subCounty || "",
      ward: initialData.ward || "",
      ownership: initialData.ownership,
      level: initialData.level,
      registrationNumber: initialData.registrationNumber || "",
    } : {
      facilityName: "", county: "", subCounty: "", ward: "", ownership: "", level: "", registrationNumber: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="facilityName" render={({ field }) => (
          <FormItem><FormLabel>Facility Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="county" render={({ field }) => (
            <FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="subCounty" render={({ field }) => (
            <FormItem><FormLabel>Sub-County (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="ownership" render={({ field }) => (
            <FormItem><FormLabel>Ownership</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="level" render={({ field }) => (
            <FormItem><FormLabel>Level</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="ward" render={({ field }) => (
            <FormItem><FormLabel>Ward (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="registrationNumber" render={({ field }) => (
            <FormItem><FormLabel>Registration # (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
        </Button>
      </form>
    </Form>
  );
}

export default function AdminHospitals() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: pageData, isLoading } = useListAdminHospitals({ q: debouncedQ, page, pageSize: 20 }, { query: { queryKey: ["admin-hospitals", debouncedQ, page] } });
  const createMutation = useCreateHospital();
  const updateMutation = useUpdateHospital();
  const deleteMutation = useDeleteHospital();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-hospitals"] });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Facilities</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Facility</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Facility</DialogTitle></DialogHeader>
            <HospitalForm 
              isLoading={createMutation.isPending}
              onSubmit={(data) => {
                createMutation.mutate({ data }, { onSuccess: () => { setCreateOpen(false); invalidate(); } });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ImportPanel onImportSuccess={invalidate} />

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search facilities..." 
              value={q} 
              onChange={e => { setQ(e.target.value); setPage(1); }} 
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {pageData ? `Showing ${pageData.items.length} of ${pageData.total}` : ""}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead>County</TableHead>
              <TableHead>Level / Ownership</TableHead>
              <TableHead className="text-right">Reports</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : pageData?.items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No facilities found.</TableCell></TableRow>
            ) : (
              pageData?.items.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.facilityName}</TableCell>
                  <TableCell>{h.county}</TableCell>
                  <TableCell>
                    <div className="text-sm">{h.level}</div>
                    <div className="text-xs text-muted-foreground">{h.ownership}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{h.reportsReceived}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={editingId === h.id} onOpenChange={(open) => setEditingId(open ? h.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Pencil className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Facility</DialogTitle></DialogHeader>
                        <HospitalForm 
                          initialData={h}
                          isLoading={updateMutation.isPending}
                          onSubmit={(data) => {
                            updateMutation.mutate({ id: h.id, data }, { onSuccess: () => { setEditingId(null); invalidate(); } });
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Delete ${h.facilityName}? This is permanent.`)) {
                          deleteMutation.mutate({ id: h.id }, { onSuccess: () => invalidate() });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
