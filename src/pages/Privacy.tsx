import { AppLayout } from "@/components/layout/AppLayout";

export default function Privacy() {
  return (
    <AppLayout>
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p>
            At WardCheck, your privacy is our highest priority. This policy outlines how we collect, use, and protect your information when you use our transparency tool.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Information Collection</h2>
          <p>
            When you submit a workplace report, we collect specific, structured data regarding the issue (e.g., job category, employment year, and reason). We may collect an email address for internal verification, but this is entirely optional.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Data Visibility</h2>
          <p>
            We strictly enforce a policy of non-disclosure regarding personal details. Your name, email address, and any free-text evidence you might provide are never published or made visible on the public site. Only an aggregated numeric count of reports is displayed per facility.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8 mb-4">Data Protection</h2>
          <p>
            We utilize robust security measures to ensure your data is stored safely. Access to personal or identifying information is restricted strictly to our moderation team and is never shared with third parties or the facilities being reported.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
