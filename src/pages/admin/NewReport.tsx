import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import {
  useCreateAdminReport,
  useGetAdminReportsAnalytics,
} from "@/hooks/api-client";
import {
  AdminReportFields,
  adminReportValuesToInput,
  useAdminReportForm,
  type AdminReportFormValues,
} from "@/components/admin/AdminReportFields";
import { ApiError } from "@/api/client";
import { CheckCircle2, Loader2, ShieldCheck, Save, Copy, X, FileText } from "lucide-react";

export default function AdminNewReport() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  useSeo({
    title: "New Report | WardCheck Admin",
    description: "WardCheck admin report entry.",
    path: "/admin/new-report",
    robots: "noindex,nofollow",
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const createReport = useCreateAdminReport();
  const { data: analytics } = useGetAdminReportsAnalytics();

  const form = useAdminReportForm({});

  const resetForNextEntry = () => {
    form.resetField("jobCategory");
    form.resetField("reason");
    form.setValue("email", "");
    form.setValue("internalNotes", "");
    form.clearErrors();
  };

  const submitReport = async (values: AdminReportFormValues, mode: "save" | "saveAndAddAnother") => {
    setSubmissionError(null);
    setIsSuccess(false);

    try {
      await createReport.mutateAsync(adminReportValuesToInput(values));

      await queryClient.invalidateQueries({ queryKey: ["admin-reports-analytics"] });

      toast({
        title: "Report saved",
        description: "The report was approved and added to public statistics.",
      });

      if (mode === "saveAndAddAnother") {
        setIsSuccess(true);
        resetForNextEntry();
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmissionError(error.body || "We could not save this report right now.");
      } else {
        setSubmissionError("We could not save this report right now.");
      }
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Report</h1>
          <p className="mt-1 text-muted-foreground">
            Data-entry tool for verified reports. Reports are approved immediately and never shown as admin-sourced.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
          <ShieldCheck className="w-4 h-4" />
          Auto-approved
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Reports Created</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.adminReportsCreated?.toLocaleString() ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports Entered Today</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.reportsEnteredToday?.toLocaleString() ?? "-"}</div>
          </CardContent>
        </Card>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reports per Facility</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              {analytics.reportsPerFacility.length > 0 ? (
                <ol className="divide-y">
                  {analytics.reportsPerFacility.map((entry) => (
                    <li key={entry.facilityId} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium truncate pr-4">{entry.facilityName}</span>
                      <span className="shrink-0 font-semibold">{entry.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No admin reports yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reports per Admin</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              {analytics.reportsPerAdmin.length > 0 ? (
                <ol className="divide-y">
                  {analytics.reportsPerAdmin.map((entry) => (
                    <li key={entry.adminId} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium truncate pr-4">{entry.adminName}</span>
                      <span className="shrink-0 font-semibold">{entry.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No admin reports yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-3xl">
        <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
          {isSuccess && (
            <div className="mb-6 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Report saved and approved. Continue entering reports for this facility.</span>
            </div>
          )}
          {submissionError && (
            <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submissionError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => submitReport(values, "save"))} className="space-y-6">
              <AdminReportFields form={form} />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/reports")}
                  disabled={createReport.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit((values) => submitReport(values, "saveAndAddAnother"))}
                  disabled={createReport.isPending}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Save & Add Another
                </Button>
                <Button type="submit" className="sm:ml-auto" disabled={createReport.isPending}>
                  {createReport.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
