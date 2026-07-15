import { AppLayout } from "@/components/layout/AppLayout";

export default function Contact() {
  return (
    <AppLayout>
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p>
            If you have questions, feedback, or need to request a review of the information displayed on WardCheck, please reach out to our support team.
          </p>
          <div className="p-6 bg-muted/20 border rounded-xl mt-8">
            <h2 className="text-lg font-bold text-foreground mb-2">Email Support</h2>
            <p className="mb-4">For all inquiries, including facility correction requests and technical support, email us at:</p>
            <a href="mailto:support@wardcheck.co.ke" className="text-primary font-semibold hover:underline text-lg">
              support@wardcheck.co.ke
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
