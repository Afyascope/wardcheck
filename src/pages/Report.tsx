import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  useCreateReport,
  useSearchHospitals,
  useGetHospital,
  getGetHospitalQueryKey,
  JobCategory,
  ReportReason,
} from "@/hooks/api-client";
import { CheckCircle2, Loader2, Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiError } from "@/api/client";
import { getBrowserFingerprintHash } from "@/lib/browser-fingerprint";
import { trackEvent } from "@/lib/analytics";

const formSchema = z.object({
  hospitalId: z.number({ required_error: "Please select a facility." }),
  jobCategory: z.enum([
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
  ], { required_error: "Please select a job category." }),
  employmentYear: z.coerce.number()
    .min(1950, "Year must be 1950 or later.")
    .max(new Date().getFullYear(), "Year cannot be in the future."),
  reason: z.enum([
    ReportReason.Delayed_salary,
    ReportReason.Salary_not_paid,
    ReportReason.Underpayment,
    ReportReason.Contract_dispute,
    ReportReason.Poor_management,
    ReportReason.Bullying,
    ReportReason.Long_working_hours,
    ReportReason.Unsafe_working_conditions,
    ReportReason.Other,
  ], { required_error: "Please select a reason." }),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
});

export default function Report() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialHospitalId = params.get("hospitalId") ? Number(params.get("hospitalId")) : undefined;

  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fingerprintHash, setFingerprintHash] = useState<string | undefined>();
  const createReport = useCreateReport();

  useEffect(() => {
    let cancelled = false;

    void getBrowserFingerprintHash()
      .then(({ fingerprintHash: hash }) => {
        if (!cancelled) {
          setFingerprintHash(hash);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFingerprintHash(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hospitalId: initialHospitalId,
      employmentYear: new Date().getFullYear(),
      email: "",
    },
  });

  const selectedHospitalId = form.watch("hospitalId");
  const { data: selectedHospital } = useGetHospital(selectedHospitalId, {
    query: { enabled: !!selectedHospitalId, queryKey: getGetHospitalQueryKey(selectedHospitalId) },
  });

  const [hospitalQuery, setHospitalQuery] = useState("");
  const debouncedHospitalQuery = useDebounce(hospitalQuery, 300);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);
  
  const { data: searchResults } = useSearchHospitals(
    { q: debouncedHospitalQuery, limit: 5 },
    { query: { enabled: debouncedHospitalQuery.length > 1, queryKey: ["search-hospitals-report", debouncedHospitalQuery] } }
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmissionError(null);

    try {
      const resolvedFingerprintHash =
        fingerprintHash ??
        (await getBrowserFingerprintHash()
          .then(({ fingerprintHash: hash }) => {
            setFingerprintHash(hash);
            return hash;
          })
          .catch(() => undefined));

      await createReport.mutateAsync({
  data: {
    hospitalId: values.hospitalId,
    jobCategory: values.jobCategory,
    employmentYear: values.employmentYear,
    reason: values.reason,
    email: values.email || undefined,
  },
  fingerprintHash: resolvedFingerprintHash,
});

// Send analytics event only after a successful save
trackEvent("report_submitted", {
  facility_name: selectedHospital?.facilityName,
  county: selectedHospital?.county,
  job_category: values.jobCategory,
  report_reason: values.reason,
});

setIsSuccess(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setSubmissionError("You have already submitted a workplace report for this facility.");
          return;
        }
        if (error.status === 429) {
          setSubmissionError("You have reached the report submission limit. Please try again later.");
          return;
        }
      }

      setSubmissionError("We could not submit your report right now. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 bg-muted/10 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            {isSuccess ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-foreground mb-4">Thank you.</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Your report has been received and will be reviewed before being added to the statistics.
                </p>
                <Button onClick={() => window.location.href = "/"} variant="outline">
                  Return to homepage
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground mb-2">Report a Facility</h1>
                <p className="text-muted-foreground mb-8">
                  Submit a workplace report to help improve transparency. Your personal information will remain strictly confidential and will never be published.
                </p>
                {submissionError && (
                  <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {submissionError}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
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
                                      {searchResults.map(h => (
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
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      No facilities found.
                                    </div>
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
                            <FormLabel>Job Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(JobCategory).map(cat => (
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
                          <FormLabel>Reason for Report</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an issue" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(ReportReason).map(reason => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
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

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={createReport.isPending}>
                      {createReport.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : "Submit Report"}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
