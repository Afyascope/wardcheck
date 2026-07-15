import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-12 mt-auto">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-bold text-lg mb-2">WardCheck</div>
          <div className="text-sm text-muted-foreground mb-4">Know your next employer.</div>
          <a href="mailto:support@wardcheck.co.ke" className="text-sm text-primary hover:underline">support@wardcheck.co.ke</a>
        </div>
        <div>
          <div className="font-semibold mb-4">Platform</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/report" className="text-muted-foreground hover:text-foreground">Report an Issue</Link></li>
            <li><Link href="/search" className="text-muted-foreground hover:text-foreground">Search Facilities</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-4">Legal</div>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
            <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Use</Link></li>
            <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
