import { AppLayout } from "@/components/layout/AppLayout";

export default function Terms() {
  return (
    <AppLayout>
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p>
            Welcome to WardCheck. By accessing or using our search tool and reporting features, you agree to be bound by these terms.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Use of the Platform</h2>
          <p>
            WardCheck is intended to be used as a transparency tool for healthcare workers. You agree to use the platform in a professional manner and to only submit reports based on genuine, first-hand experiences.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Disclaimer of Liability</h2>
          <p>
            The report counts displayed on WardCheck are aggregated submissions received after moderation. A report count does not constitute proof of wrongdoing, legal liability, or formal judgment against any facility. We provide this data "as is" for informational purposes only.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Facility Rights</h2>
          <p>
            Registered health facilities may request a review or correction of information they believe to be inaccurate. WardCheck reserves the right to moderate, approve, or reject reports in accordance with our internal verification standards to ensure the integrity of our statistics.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
