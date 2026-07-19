import { useGetNationalStats } from "@/hooks/api-client";
import { SearchBox } from "@/components/SearchBox";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

export default function Home() {
  const { data: stats } = useGetNationalStats();

  useSeo({
    title: "WardCheck — Know Your Next Employer",
    description:
      "Search Kenyan health facilities for workplace transparency data. See reports on unpaid wages, delayed salaries, and harsh working conditions before you take a job.",
    path: "/",
  });

  return (
    <AppLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-4xl leading-none mx-auto mb-6 shadow-sm">
              W
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              WardCheck
            </h1>
            <p className="text-xl text-muted-foreground mb-10 font-medium">
              Know your next employer.
            </p>
            
            <SearchBox />

            <div className="mt-8 flex items-center justify-center">
              <Button asChild variant="default" className="rounded-full font-semibold">
                <Link href="/report">Report a facility</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">National Workplace Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Registered Facilities</CardTitle>
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.registeredFacilities?.toLocaleString() ?? "-"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Facilities with Reports</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.facilitiesWithReports?.toLocaleString() ?? "-"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Facilities With Zero Reports</CardTitle>
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats?.facilitiesWithZeroReports?.toLocaleString() ?? "-"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports Received</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalReports?.toLocaleString() ?? "-"}</div>
                </CardContent>
              </Card>
            </div>

            {stats?.newestFacilitiesReported && stats.newestFacilitiesReported.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold mb-4 text-center">Recently Reported Facilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.newestFacilitiesReported.map(facility => (
                    <Link key={facility.id} href={`/facility/${facility.slug}`}>
                      <div className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer bg-card">
                        <div className="font-semibold text-foreground truncate">{facility.facilityName}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {facility.county} County • {facility.level}
                        </div>
                        <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {facility.reportsReceived} reports
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer Section */}
        {/* Transparency & Disclaimer */}
<section className="py-12 px-4 border-t bg-muted/20">
  <div className="max-w-4xl mx-auto">
    <div className="p-6 bg-white border border-border/50 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Transparency & Disclaimer
      </h2>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        WardCheck is an <strong className="text-foreground">independent healthcare workplace transparency platform</strong> designed to help healthcare professionals make informed career decisions through objective, aggregated workplace data.
      </p>

      <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
        <li>
          <strong className="text-foreground">Official Facility Information:</strong> Facility names, ownership, levels, counties, and registration details are sourced from the official Kenya Medical Practitioners and Dentists Council (KMPDC) public register.
        </li>

        <li>
          <strong className="text-foreground">Moderated Reporting:</strong> Workplace reports are submitted by healthcare workers and other individuals and undergo moderation before contributing to publicly displayed statistics.
        </li>

        <li>
          <strong className="text-foreground">Aggregated Statistics Only:</strong> WardCheck does not publish comments, ratings, personal opinions, or reporter identities. Only aggregated report counts and common workplace concerns are displayed.
        </li>

        <li>
          <strong className="text-foreground">No Finding of Wrongdoing:</strong> Report counts and workplace concern summaries do not constitute proof of misconduct, regulatory action, legal liability, or findings of fact. They are intended solely to provide additional context when evaluating workplaces.
        </li>

        <li>
          <strong className="text-foreground">Independent Platform:</strong> WardCheck does not independently investigate or verify the underlying claims contained in individual reports beyond its moderation and validation process.
        </li>

        <li>
          <strong className="text-foreground">Correction Requests:</strong> Registered health facilities that believe information displayed is inaccurate or outdated may request a review or correction by contacting our support team. Verified corrections will be reflected on the platform where appropriate.
        </li>
      </ul>
    </div>
  </div>
</section>
      </div>
    </AppLayout>
  );
}
