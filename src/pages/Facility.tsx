import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetHospitalBySlug, getGetHospitalBySlugQueryKey } from "@/hooks/api-client";
import { useParams, Link } from "wouter";
import { FullPageLoader } from "@/components/ui/loaders";
import { Building2, AlertTriangle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useSeo } from "@/hooks/use-seo";


export default function Facility() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { data: facility, isLoading, error } = useGetHospitalBySlug(slug, {
    query: { enabled: !!slug, queryKey: getGetHospitalBySlugQueryKey(slug) },
  });
  
  useEffect(() => {
  if (!facility) return;

  trackEvent("facility_viewed", {
    facility_id: facility.id,
    facility_name: facility.facilityName,
    county: facility.county,
    ownership: facility.ownership,
    level: facility.level,
    reports_received: facility.reportsReceived,
  });
}, [facility]);

  useSeo({
    title: facility
      ? `${facility.facilityName} — Workplace Reports | WardCheck`
      : "Facility | WardCheck",
    description: facility
      ? `See workplace transparency data for ${facility.facilityName} in ${facility.county} County: reports received and the most common workplace concern, sourced from healthcare workers.`
      : "Facility workplace transparency data on WardCheck.",
    path: `/facility/${slug}`,
    type: "article",
    jsonLd: facility
      ? {
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: facility.facilityName,
          address: {
            "@type": "PostalAddress",
            addressRegion: facility.county,
            addressCountry: "KE",
          },
        }
      : undefined,
  });

  return (
    <AppLayout>
      <div className="flex-1 bg-muted/10 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/search" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to search
          </Link>

          {isLoading ? (
            <FullPageLoader />
          ) : error || !facility ? (
            <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Facility not found</h2>
              <p className="text-muted-foreground">We couldn't load the details for this facility.</p>
            </div>
          ) : (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b bg-muted/5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">{facility.facilityName}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{facility.county} County</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{facility.ownership}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{facility.level}</span>
                  {facility.kmpdcRegistrationNumber && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>Reg: {facility.kmpdcRegistrationNumber}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Reports Received is the primary visual element on this page. */}
              <div className="p-8 border-b flex flex-col items-center text-center bg-gradient-to-b from-muted/10 to-transparent">
                <div className={`text-7xl font-black mb-2 leading-none ${facility.reportsReceived > 0 ? "text-destructive" : "text-green-600"}`}>
                  {facility.reportsReceived}
                </div>
                <div className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                  Report{facility.reportsReceived !== 1 ? "s" : ""} Received
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-lg font-bold mb-3">Most Common Workplace Concern</h3>
                {facility.mostCommonConcern ? (
                  <div className="p-4 rounded-xl border bg-destructive/10 border-destructive/20 text-destructive">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-destructive" />
                      <div className="font-medium">{facility.mostCommonConcern}</div>
                    </div>
                  </div>
                ) : facility.reportsReceived > 0 ? (
                  <div className="p-4 rounded-xl border bg-muted/20 border-border text-muted-foreground">
                    No common workplace concern available yet — reports haven't reached the threshold needed to surface a pattern.
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border bg-green-50 border-green-200 text-green-800">
                    No workplace reports submitted for this facility.
                  </div>
                )}

                <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                  <div>
                    Last updated: {facility.lastUpdated ? format(new Date(facility.lastUpdated), "MMMM d, yyyy") : format(new Date(facility.createdAt), "MMMM d, yyyy")}
                  </div>
                  <Link href={`/report?hospitalId=${facility.id}`} className="text-primary font-medium hover:underline">
                    Report this facility
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
