import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
          <Link href="/blog" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <Button asChild variant="outline" className="font-semibold">
            <Link href="/report">Report a facility</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
