import { Flag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const reportCtaClasses =
  "rounded-lg px-6 shadow-md hover:shadow-lg transition-all active:scale-[0.98] hover:bg-destructive/90 text-white font-semibold";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl leading-none">
            W
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">WardCheck</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button asChild variant="destructive" className={reportCtaClasses}>
            <Link href="/report">
              <Flag className="w-4 h-4" />
              Report a facility
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
