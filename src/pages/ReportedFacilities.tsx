import { DirectoryPage } from "@/components/DirectoryPage";

export default function ReportedFacilities() {
  return (
    <DirectoryPage
      filter="reported"
      title="Facilities with Reports"
      description="Kenya healthcare facilities that have received verified workplace reports. Review report counts and the most common concerns before choosing your next employer."
      seoTitle="Facilities with Reports — WardCheck"
      seoDescription="Browse Kenya healthcare facilities that have received verified workplace reports. Review report counts and the most common concerns before choosing your next employer."
      seoPath="/reported-facilities"
      variant="reported"
    />
  );
}
