import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Calendar } from "@/pages/Calendar";
import { Chores } from "@/pages/Chores";
import { Routines } from "@/pages/Routines";
import { School } from "@/pages/School";
import { Announcements } from "@/pages/Announcements";
import { Goals } from "@/pages/Goals";
import { Finances } from "@/pages/Finances";
import { Groceries } from "@/pages/Groceries";
import { Maintenance } from "@/pages/Maintenance";
import { Notes } from "@/pages/Notes";
import { Members } from "@/pages/Members";
import { Settings } from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
  },
});

function ProtectedRoute({ component: Component, parentOnly }: { component: React.ComponentType; parentOnly?: boolean }) {
  const { user, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (parentOnly && user.mode === "kids") return <Redirect to="/dashboard" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/calendar">{() => <ProtectedRoute component={Calendar} />}</Route>
      <Route path="/chores">{() => <ProtectedRoute component={Chores} />}</Route>
      <Route path="/routines">{() => <ProtectedRoute component={Routines} />}</Route>
      <Route path="/school">{() => <ProtectedRoute component={School} />}</Route>
      <Route path="/announcements">{() => <ProtectedRoute component={Announcements} />}</Route>
      <Route path="/goals">{() => <ProtectedRoute component={Goals} />}</Route>
      <Route path="/finances">{() => <ProtectedRoute component={Finances} parentOnly />}</Route>
      <Route path="/groceries">{() => <ProtectedRoute component={Groceries} />}</Route>
      <Route path="/maintenance">{() => <ProtectedRoute component={Maintenance} parentOnly />}</Route>
      <Route path="/notes">{() => <ProtectedRoute component={Notes} parentOnly />}</Route>
      <Route path="/members">{() => <ProtectedRoute component={Members} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
