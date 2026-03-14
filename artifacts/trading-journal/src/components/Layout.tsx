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
  CalendarDays
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

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/journal", label: "Trade Journal", icon: BookOpen },
  { path: "/analytics", label: "Analytics", icon: LineChart },
  { path: "/calendar", label: "Calendar", icon: CalendarIcon },
  { path: "/playbooks", label: "Playbooks", icon: BookOpen },
  { path: "/weekly-review", label: "Weekly Review", icon: CalendarDays },
  { path: "/goals", label: "Goals", icon: Target },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <KeyboardShortcuts />
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar h-full z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">TradeLog</span>
        </div>

        <div className="px-4 pb-4">
          <Button 
            className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white shadow-lg shadow-primary/25 border-0 hover-elevate" 
            onClick={() => setIsAddTradeOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-1 border-t border-white/5">
          <button onClick={() => setIsCalculatorOpen(true)} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
            <CalculatorIcon className="w-5 h-5" />
            <span>Calculator</span>
          </button>
          <button onClick={toggleTheme} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
          <div className="pt-2 text-center text-xs text-muted-foreground/50">
            Press ? for shortcuts
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">TradeLog</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => setIsAddTradeOpen(true)}>
              <Plus className="w-5 h-5 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-[65px] left-0 w-full bg-card border-b border-border z-30 shadow-2xl md:hidden">
            <nav className="flex flex-col p-2">
              {NAV_ITEMS.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    location === item.path ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
            {children}
          </div>
        </main>
      </div>

      <AddTradeModal open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} />
      <RiskCalculator open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen} />
    </div>
  );
}
