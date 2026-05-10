import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Journal from "@/pages/Journal";
import DailyJournal from "@/pages/DailyJournal";
import Integrations from "@/pages/Integrations";
import Analytics from "@/pages/Analytics";
import CalendarView from "@/pages/CalendarView";
import Goals from "@/pages/Goals";
import Playbooks from "@/pages/Playbooks";
import WeeklyReview from "@/pages/WeeklyReview";
import Reports from "@/pages/Reports";
import Notebook from "@/pages/Notebook";
import Challenges from "@/pages/Challenges";
import SettingsPage from "@/pages/Settings";
import SignupPage from "@/pages/Signup";
import LandingPage from "@/pages/Landing";
import Backtest from "@/pages/Backtest";
import BacktestSession from "@/pages/BacktestSession";
import StrategyIntelligence from "@/pages/StrategyIntelligence";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/signup" component={SignupPage} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />

            <Route path="/daily-journal" component={DailyJournal} />
            <Route path="/journal" component={Journal} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/reports" component={Reports} />
            <Route path="/notebook" component={Notebook} />
            <Route path="/challenges" component={Challenges} />
            <Route path="/calendar" component={CalendarView} />
            <Route path="/goals" component={Goals} />
            <Route path="/playbooks" component={Playbooks} />
            <Route path="/weekly-review" component={WeeklyReview} />
            <Route path="/backtest" component={Backtest} />
            <Route path="/backtest/:id" component={BacktestSession} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/strategy" component={StrategyIntelligence} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={false} 
      storageKey="trade-insight-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
