import { DirectoryPage } from "@/components/DirectoryPage";

export default function NoReportsFacilities() {
  return (
    <DirectoryPage
      filter="no-reports"
      title="Facilities with Zero Reports"
      description="Registered healthcare facilities that have not yet received any workplace reports. No news is not always good news — search, filter, and review before choosing your next employer."
      seoTitle="Facilities with Zero Reports — WardCheck"
      seoDescription="Browse Kenya registered healthcare facilities with no workplace reports yet. Search by county, level, or ownership before choosing your next employer."
      seoPath="/no-reports"
    />
  );
}
