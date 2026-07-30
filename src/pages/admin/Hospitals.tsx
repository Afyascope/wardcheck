import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminHospitals, useCreateHospital, useUpdateHospital, useDeleteHospital, useImportHospitals, Hospital } from "@/hooks/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeo } from "@/hooks/use-seo";
import { FullPageLoader } from "@/components/ui/loaders";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

export default function AdminHospitals() {
  useSeo({
    title: "Manage Facilities | WardCheck Admin",
    description: "WardCheck admin facilities management.",
    path: "/admin/hospitals",
    robots: "noindex,nofollow",
  });

  const [search, setSearch] = useState("");
  const { data: hospitals, isLoading } = useListAdminHospitals({ q: search || undefined, limit: 100 });

  /* ─── Create / Edit dialog ─── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Hospital | null>(null);
  const create = useCreateHospital();
  const update = useUpdateHospital();
  const remove = useDeleteHospital();
  const importMutation = useImportHospitals();

  const [form, setForm] = useState({
    facilityName: "",
    county: "",
    subCounty: "",
    ward: "",
    ownership: "",
    level: "",
    registrationNumber: "",
    kmpdcRegistrationNumber: "",
  });

  function openCreate() {
    setEditing(null);
    setForm({
      facilityName: "",
      county: "",
      subCounty: "",
      ward: "",
      ownership: "",
      level: "",
      registrationNumber: "",
      kmpdcRegistrationNumber: "",
    });
    setDialogOpen(true);
  }

  function openEdit(h: Hospital) {
    setEditing(h);
    setForm({
      facilityName: h.facilityName,
      county: h.county,
      subCounty: h.subCounty ?? "",
      ward: h.ward ?? "",
      ownership: h.ownership,
      level: h.level,
      registrationNumber: h.registrationNumber ?? "",
      kmpdcRegistrationNumber: h.kmpdcRegistrationNumber ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editing) {
      await update.mutateAsync({ id: editing.id, data: form });
    } else {
      await create.mutateAsync({ data: form });
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this facility? This cannot be undone.")) {
      await remove.mutateAsync({ id });
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Facilities</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => importMutation.mutateAsync({})} disabled={importMutation.isPending}>
            {importMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sync from KMPDC
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Facility
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities…"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <FullPageLoader />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals?.items.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.facilityName}</TableCell>
                  <TableCell>{h.county}</TableCell>
                  <TableCell>{h.level}</TableCell>
                  <TableCell>{h.ownership}</TableCell>
                  <TableCell>{h.reportsReceived}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(h)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(h.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Facility" : "Add Facility"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update facility details" : "Enter the details of the new facility"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Facility Name</Label>
              <Input value={form.facilityName} onChange={(e) => setForm({ ...form, facilityName: e.target.value })} />
            </div>
            <div>
              <Label>County</Label>
              <Input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
            </div>
            <div>
              <Label>Sub-County</Label>
              <Input value={form.subCounty} onChange={(e) => setForm({ ...form, subCounty: e.target.value })} />
            </div>
            <div>
              <Label>Ward</Label>
              <Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
            </div>
            <div>
              <Label>Level</Label>
              <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </div>
            <div>
              <Label>Ownership</Label>
              <Input value={form.ownership} onChange={(e) => setForm({ ...form, ownership: e.target.value })} />
            </div>
            <div>
              <Label>KMPDC Reg No.</Label>
              <Input value={form.kmpdcRegistrationNumber} onChange={(e) => setForm({ ...form, kmpdcRegistrationNumber: e.target.value })} />
            </div>
            <div>
              <Label>Registration No.</Label>
              <Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
