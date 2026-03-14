import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  Calendar as CalendarIcon,
  Target,
  Plus,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Calculator as CalculatorIcon,
  CalendarDays,
  BarChart2,
  Lightbulb,
  NotebookPen,
  Trophy,
  BookMarked,
  GraduationCap,
  HelpCircle,
  User,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import AddTradeModal from "./AddTradeModal";
import KeyboardShortcuts from "./KeyboardShortcuts";
import RiskCalculator from "./RiskCalculator";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/journal", label: "Daily Journal", icon: BookOpen },
      { path: "/journal", label: "Trade Log", icon: LineChart, exact: false },
      { path: "/reports", label: "Reports", icon: BarChart2 },
      { path: "/analytics", label: "Insights", icon: Lightbulb },
    ],
  },
  {
    label: "Tools",
    items: [
      { path: "/notebook", label: "Notebook", icon: NotebookPen },
      { path: "/playbooks", label: "Playbook", icon: BookMarked },
      { path: "/challenges", label: "Challenges", icon: Trophy },
      { path: "/calendar", label: "Calendar", icon: CalendarIcon },
      { path: "/weekly-review", label: "Weekly Review", icon: CalendarDays },
    ],
  },
  {
    label: "Performance",
    items: [
      { path: "/goals", label: "Goals", icon: Target },
    ],
  },
];

const MAIN_NAV = NAV_SECTIONS[0].items;
const TOOLS_NAV = NAV_SECTIONS[1].items;
const PERF_NAV = NAV_SECTIONS[2].items;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("tradelog-theme") || "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("tradelog-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  useEffect(() => {
    const handleOpenAddTrade = () => setIsAddTradeOpen(true);
    window.addEventListener("open-add-trade", handleOpenAddTrade);
    return () => window.removeEventListener("open-add-trade", handleOpenAddTrade);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const NavItem = ({ item }: { item: typeof MAIN_NAV[0] }) => {
    const active = isActive(item.path);
    return (
      <Link
        href={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative",
          isCollapsed ? "justify-center px-2" : "",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {active && !isCollapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
        )}
        <item.icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        {!isCollapsed && <span className="text-sm">{item.label}</span>}
        {active && isCollapsed && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-l-full" />
        )}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => {
    if (isCollapsed) return <div className="my-3 border-t border-border/50" />;
    return <p className="px-3 mb-1 mt-5 first:mt-0 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">{label}</p>;
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <KeyboardShortcuts />

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar h-full z-10 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {/* Logo */}
        <div className={cn("h-[72px] flex items-center border-b border-border/50 px-4 gap-3", isCollapsed ? "justify-center px-3" : "px-5")}>
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground">TradeLog</span>
          )}
          {!isCollapsed && (
            <button onClick={() => setIsCollapsed(true)} className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Add Trade Button */}
        {!isCollapsed ? (
          <div className="px-4 py-3">
            <Button
              className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 border-0"
              onClick={() => setIsAddTradeOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Trade
            </Button>
          </div>
        ) : (
          <div className="px-2.5 py-3">
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="w-full flex items-center justify-center h-9 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              title="Add Trade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto py-2", isCollapsed ? "px-2" : "px-3")}>
          <SectionLabel label="Main" />
          {MAIN_NAV.map(item => <NavItem key={`${item.path}-${item.label}`} item={item} />)}

          <SectionLabel label="Tools" />
          {TOOLS_NAV.map(item => <NavItem key={`${item.path}-${item.label}`} item={item} />)}

          <SectionLabel label="Performance" />
          {PERF_NAV.map(item => <NavItem key={`${item.path}-${item.label}`} item={item} />)}
        </nav>

        {/* Bottom Controls */}
        <div className={cn("py-3 border-t border-border/50 space-y-1", isCollapsed ? "px-2" : "px-3")}>
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex w-full items-center justify-center h-9 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className={cn("flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all", isCollapsed && "justify-center px-2")}
            title={isCollapsed ? "Risk Calculator" : undefined}
          >
            <CalculatorIcon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm">Calculator</span>}
          </button>
          <button
            onClick={toggleTheme}
            className={cn("flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all", isCollapsed && "justify-center px-2")}
            title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {!isCollapsed && <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <Link
            href="/settings"
            className={cn("flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all", isCollapsed && "justify-center px-2")}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">TradeLog</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setIsAddTradeOpen(true)}>
              <Plus className="w-4 h-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-[57px] left-0 w-full bg-sidebar border-b border-border z-30 shadow-2xl md:hidden">
            <nav className="flex flex-col p-3 gap-1">
              {[...MAIN_NAV, ...TOOLS_NAV, ...PERF_NAV].map((item) => (
                <Link
                  key={`${item.path}-${item.label}`}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg text-sm",
                    isActive(item.path) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background relative">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
          <div className="p-6 md:p-8 max-w-7xl mx-auto w-full relative z-10">
            {children}
          </div>
        </main>
      </div>

      <AddTradeModal open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} />
      <RiskCalculator open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen} />
    </div>
  );
}
