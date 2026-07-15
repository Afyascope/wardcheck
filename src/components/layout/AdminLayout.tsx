import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/react";
import { Building2, FileText, LayoutDashboard, LogOut } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-muted/10">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center font-bold text-xl leading-none">
              W
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Admin</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className={`text-sm font-medium flex items-center gap-2 ${location === '/admin' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
            <Link href="/admin/hospitals" className={`text-sm font-medium flex items-center gap-2 ${location.startsWith('/admin/hospitals') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Building2 className="w-4 h-4" />
              Facilities
            </Link>
            <Link href="/admin/reports" className={`text-sm font-medium flex items-center gap-2 ${location.startsWith('/admin/reports') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <FileText className="w-4 h-4" />
              Reports
            </Link>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
