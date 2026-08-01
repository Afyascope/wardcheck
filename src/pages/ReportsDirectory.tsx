import { DirectoryPage } from "@/components/DirectoryPage";

export default function ReportsDirectory() {
  return (
    <DirectoryPage
      filter="reported"
      title="Reports Directory"
      description="Facilities ranked by approved workplace reports. Review report counts, the most common concerns, and when each facility was last updated."
      seoTitle="Reports Directory — WardCheck"
      seoDescription="Browse Kenya healthcare facilities ranked by approved workplace reports. Review report counts, common concerns, and last updated dates."
      seoPath="/reports"
      variant="reported"
    />
  );
}
