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
        <section className="py-12 px-4 border-t bg-muted/20">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 bg-white border border-border/50 rounded-xl text-sm leading-relaxed text-muted-foreground shadow-sm">
              <strong className="text-foreground">Disclaimer: </strong>
              WardCheck is an independent workplace transparency platform. Reports are submitted by healthcare workers and other individuals, and are reviewed by our moderation team before they are published or counted toward a facility's statistics. Report counts and the "Most Common Workplace Concern" reflect aggregated, approved submissions and are intended to help job seekers make informed decisions — they do not constitute proof of wrongdoing, a finding of fact, or legal liability on the part of any facility. WardCheck does not independently investigate or verify the underlying claims in each report beyond moderation review. Any facility that believes information displayed about it is inaccurate, outdated, or unfair may request a correction or review by contacting us; we will investigate and update the record where warranted.
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
