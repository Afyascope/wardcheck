import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { PageTracker } from "@/components/PageTracker";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Facility from "@/pages/Facility";
import Report from "@/pages/Report";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";

import Login from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminHospitals from "@/pages/admin/Hospitals";
import AdminReports from "@/pages/admin/Reports";
import AdminImports from "@/pages/admin/Imports";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/admin/login" />;

  return <Component />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/facility/:slug" component={Facility} />
      <Route path="/report" component={Report} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />

      <Route path="/admin/login" component={Login} />

      <Route path="/admin">
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/hospitals">
        <AdminRoute component={AdminHospitals} />
      </Route>
      <Route path="/admin/reports">
        <AdminRoute component={AdminReports} />
      </Route>
      <Route path="/admin/imports">
        <AdminRoute component={AdminImports} />
      </Route>

     <Route>
  <AppLayout>
    <div className="flex-1 flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <span className="text-4xl">🔍</span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight">404</h1>

        <h2 className="mt-4 text-2xl font-semibold">
          Page Not Found
        </h2>

        <p className="mt-4 text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
          If you entered the address manually, please check the URL and try again.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Return Home
          </Link>

          <Link
            to="/search"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 font-medium hover:bg-muted transition"
          >
            Search Facilities
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@wardcheck.co.ke"
            className="text-primary hover:underline"
          >
            support@wardcheck.co.ke
          </a>
        </p>
      </div>
    </div>
  </AppLayout>
</Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <PageTracker />
           <AppRoutes />
            <Toaster />
            </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
