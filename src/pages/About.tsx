import { AppLayout } from "@/components/layout/AppLayout";

export default function About() {
  return (
    <AppLayout>
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-3xl font-bold mb-8">About WardCheck</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p>
            WardCheck is a public workplace-transparency search tool designed for healthcare workers in Kenya.
            Our mission is to provide an objective, searchable registry that helps job seekers understand the workplace environment of registered health facilities.
          </p>
          <p>
            Unlike traditional review platforms, WardCheck never displays comments, ratings, names, or subjective opinions. 
            We simply record and aggregate the total number of workplace reports submitted by verified healthcare workers.
          </p>
          <p>
            By relying on a single, factual metric—"reports received"—we aim to maintain a professional, trustworthy, and minimal resource that respects the privacy of all parties while fostering workplace transparency across the Kenyan healthcare sector.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
