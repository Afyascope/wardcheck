import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  useSearchHospitals,
  useGetHospital,
  getGetHospitalQueryKey,
  JobCategory,
  ReportReason,
  AdminReportSourceType,
} from "@/hooks/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const currentYear = new Date().getFullYear();

export const adminReportSchema = z.object({
  hospitalId: z.number({ required_error: "Please select a facility." }),
  jobCategory: z.enum(
    [
      JobCategory.Clinical_Officer,
      JobCategory.Doctor,
      JobCategory.Nurse,
      JobCategory.Pharmacist,
      JobCategory.Lab_Technologist,
      JobCategory.Radiographer,
      JobCategory.Dentist,
      JobCategory.Nutritionist,
      JobCategory.Administrator,
      JobCategory.Other,
    ],
    { required_error: "Please select a category." },
  ),
  employmentYear: z.coerce.number()
    .min(1950, "Year must be 1950 or later.")
    .max(currentYear, "Year cannot be in the future."),
  reason: z.enum(
    [
      ReportReason.Delayed_salary,
      ReportReason.Salary_not_paid,
      ReportReason.Underpayment,
      ReportReason.No_written_contract,
      ReportReason.Poor_management,
      ReportReason.Bullying,
      ReportReason.Long_working_hours,
      ReportReason.Unsafe_working_conditions,
      ReportReason.Unpaid_locum,
      ReportReason.Inadequate_staffing,
      ReportReason.Other,
    ],
    { required_error: "Please select a description." },
  ),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  reportDate: z.string().optional().or(z.literal("")),
  sourceType: z.string().optional().or(z.literal("")),
  internalNotes: z.string().max(5000, "Notes must be 5000 characters or fewer.").optional().or(z.literal("")),
});

export type AdminReportFormValues = z.infer<typeof adminReportSchema>;

export const NONE_SOURCE_TYPE = "none";

type AdminReportInput = {
  hospitalId: number;
  jobCategory: AdminReportFormValues["jobCategory"];
  employmentYear: number;
  reason: AdminReportFormValues["reason"];
  email?: string;
  reportDate?: string;
  sourceType?: string;
  internalNotes?: string;
};

export function adminReportValuesToInput(values: AdminReportFormValues): AdminReportInput {
  return {
    hospitalId: values.hospitalId,
    jobCategory: values.jobCategory,
    employmentYear: values.employmentYear,
    reason: values.reason,
    email: values.email || undefined,
    reportDate: values.reportDate || undefined,
    sourceType: values.sourceType === NONE_SOURCE_TYPE || !values.sourceType ? undefined : values.sourceType,
    internalNotes: values.internalNotes || undefined,
  };
}

function matchReasonLabel(value: string): AdminReportFormValues["reason"] | undefined {
  const match = (Object.values(ReportReason) as string[]).find(
    (reason) => reason.toLowerCase() === value.toLowerCase(),
  );
  return match ? (match as AdminReportFormValues["reason"]) : undefined;
}

export function adminReportValuesFromItem(item: {
  hospitalId?: number;
  facilityId?: number;
  jobCategory: string;
  employmentYear: number;
  reason: string;
  email?: string | null;
  reportDate?: string | null;
  sourceType?: string | null;
  internalNotes?: string | null;
}): Partial<AdminReportFormValues> {
  return {
    hospitalId: item.hospitalId ?? item.facilityId,
    jobCategory: (Object.values(JobCategory) as string[]).includes(item.jobCategory)
      ? (item.jobCategory as AdminReportFormValues["jobCategory"])
      : undefined,
    employmentYear: item.employmentYear,
    reason: matchReasonLabel(item.reason),
    email: item.email ?? "",
    reportDate: item.reportDate ? item.reportDate.slice(0, 10) : "",
    sourceType: item.sourceType ?? "",
    internalNotes: item.internalNotes ?? "",
  };
}

export function AdminReportFields({
  form,
}: {
  form: UseFormReturn<AdminReportFormValues>;
}) {
  const selectedHospitalId = form.watch("hospitalId");
  const { data: selectedHospital } = useGetHospital(selectedHospitalId, {
    query: { enabled: !!selectedHospitalId, queryKey: getGetHospitalQueryKey(selectedHospitalId) },
  });

  const [hospitalQuery, setHospitalQuery] = useState("");
  const debouncedHospitalQuery = useDebounce(hospitalQuery, 300);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);

  const { data: searchResults } = useSearchHospitals(
    { q: debouncedHospitalQuery, limit: 5 },
    { query: { enabled: debouncedHospitalQuery.length > 1, queryKey: ["search-hospitals-admin", debouncedHospitalQuery] } },
  );

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="hospitalId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Health Facility</FormLabel>
            {selectedHospital ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold text-foreground">{selectedHospital.facilityName}</div>
                    <div className="text-xs text-muted-foreground">{selectedHospital.county} County</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    field.onChange(undefined);
                    setHospitalQuery("");
                    setIsSearchingHospitals(false);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search for a facility..."
                  value={hospitalQuery}
                  onChange={(e) => {
                    setHospitalQuery(e.target.value);
                    setIsSearchingHospitals(true);
                  }}
                  onFocus={() => setIsSearchingHospitals(true)}
                />
                {isSearchingHospitals && debouncedHospitalQuery.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 overflow-hidden">
                    {searchResults && searchResults.length > 0 ? (
                      <ul className="max-h-60 overflow-auto py-1">
                        {searchResults.map((h) => (
                          <li key={h.id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors flex flex-col gap-0.5"
                              onClick={() => {
                                field.onChange(h.id);
                                setIsSearchingHospitals(false);
                              }}
                            >
                              <div className="font-medium text-foreground">{h.facilityName}</div>
                              <div className="text-xs text-muted-foreground">{h.county} County</div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">No facilities found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="jobCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(JobCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employmentYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Employment</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(ReportReason).map((reason) => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-xl border bg-muted/10 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Report Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="reportDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Date <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Type <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                <Select onValueChange={field.onChange} value={field.value || NONE_SOURCE_TYPE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a source type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE_SOURCE_TYPE}>Not set</SelectItem>
                    {Object.values(AdminReportSourceType).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="For internal verification only" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="internalNotes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Internal Notes <span className="text-muted-foreground font-normal">(Optional, never shown publicly)</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Notes for the records..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function useAdminReportForm(defaultValues: Partial<AdminReportFormValues>) {
  return useForm<AdminReportFormValues>({
    resolver: zodResolver(adminReportSchema),
    defaultValues: {
      employmentYear: currentYear,
      email: "",
      reportDate: "",
      sourceType: "",
      internalNotes: "",
      ...defaultValues,
    },
  });
}
