import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { PageTracker } from "@/components/PageTracker";
import { useSeo } from "@/hooks/use-seo";
import { NotFoundPage } from "@/components/NotFound";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import ReportedFacilities from "@/pages/ReportedFacilities";
import RegisteredFacilities from "@/pages/RegisteredFacilities";
import NoReportsFacilities from "@/pages/NoReportsFacilities";
import ReportsDirectory from "@/pages/ReportsDirectory";
import Facility from "@/pages/Facility";
import Report from "@/pages/Report";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import GuidesOverview from "@/pages/GuidesOverview";
import GuideList from "@/pages/GuideList";
import GuidePost from "@/pages/GuidePost";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";

import Login from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminHospitals from "@/pages/admin/Hospitals";
import AdminReports from "@/pages/admin/Reports";
import AdminNewReport from "@/pages/admin/NewReport";
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
      <Route path="/reported-facilities" component={ReportedFacilities} />
      <Route path="/facilities" component={RegisteredFacilities} />
      <Route path="/no-reports" component={NoReportsFacilities} />
      <Route path="/reports" component={ReportsDirectory} />
      <Route path="/facility/:slug" component={Facility} />
      <Route path="/report" component={Report} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/guides" component={GuidesOverview} />
      <Route path="/guides/:type/:slug" component={GuidePost} />
      <Route path="/guides/:type" component={GuideList} />
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
      <Route path="/admin/new-report">
        <AdminRoute component={AdminNewReport} />
      </Route>
      <Route path="/admin/imports">
        <AdminRoute component={AdminImports} />
      </Route>

      <Route>
        <NotFoundPage />
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
