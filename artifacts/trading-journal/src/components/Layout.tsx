import { Link, useLocation } from "wouter";
import { useGetSettings } from "@/hooks/use-settings";
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
  Link2,
  PenLine,
  X,
  Sparkles,
  Play,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import AddTradeModal from "./AddTradeModal";
import KeyboardShortcuts from "./KeyboardShortcuts";
import RiskCalculator from "./RiskCalculator";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistant from "./AIAssistant";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/daily-journal", label: "Daily Journal", icon: PenLine },
      { path: "/journal", label: "Trade Log", icon: LineChart },
      { path: "/reports", label: "Reports", icon: BarChart2 },
      { path: "/analytics", label: "Insights", icon: Lightbulb },
    ],
  },
  {
    label: "Tools",
    items: [
      { path: "/notebook", label: "Notebook", icon: NotebookPen },
      { path: "/playbooks", label: "Playbook", icon: BookMarked },
      { path: "/strategy", label: "Strategy AI", icon: Brain },
      { path: "/challenges", label: "Challenges", icon: Trophy },
      { path: "/calendar", label: "Calendar", icon: CalendarIcon },
      { path: "/weekly-review", label: "Weekly Review", icon: CalendarDays },
      { path: "/backtest", label: "Backtest", icon: Play },
      { path: "/integrations", label: "Integrations", icon: Link2 },
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
  const { data: settings } = useGetSettings();
  const [, setLocation] = useLocation();



  useEffect(() => {
    const handleOpenAddTrade = () => setIsAddTradeOpen(true);
    window.addEventListener("open-add-trade", handleOpenAddTrade);
    return () => window.removeEventListener("open-add-trade", handleOpenAddTrade);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const renderNavItem = (item: typeof MAIN_NAV[0], showLabel: boolean = true) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        href={item.path}
        className={cn(
          "flex items-center rounded-xl transition-all duration-200 relative group",
          isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 h-10 px-3",
          active
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {/* Active state background */}
        {active && (
          <motion.div
            layoutId="activeNav"
            className={cn(
              "absolute inset-0 rounded-xl",
              // Light mode: soft purple fill
              "bg-primary/10 dark:bg-primary/[0.12]",
              "border border-primary/20 dark:border-primary/25",
              "dark:shadow-[0_0_15px_hsl(252_87%_62%/0.12)]"
            )}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        {/* Neon indicator bar */}
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className={cn(
              "absolute -left-[9px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full",
              "bg-gradient-to-b from-violet-500 to-purple-600",
              "shadow-[0_0_8px_hsl(252_87%_62%/0.6)]",
              "dark:shadow-[0_0_12px_hsl(252_87%_62%/0.8)]"
            )}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        <item.icon className={cn(
          "w-[18px] h-[18px] shrink-0 relative z-10 transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
        )} />

        {!isCollapsed && showLabel && (
          <span className={cn(
            "text-[13px] relative z-10 transition-colors duration-200",
            active ? "font-semibold" : "font-medium"
          )}>
            {item.label}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className={cn(
            "absolute left-14 bg-popover text-popover-foreground text-[11px] font-semibold",
            "px-2.5 py-1.5 rounded-lg border border-border shadow-lg",
            "opacity-0 group-hover:opacity-100 pointer-events-none",
            "transition-all duration-200 whitespace-nowrap z-50",
            "translate-x-1 group-hover:translate-x-0"
          )}>
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <KeyboardShortcuts />

      {/* ══════════════════════════════════════════════════════ */}
      {/*  SIDEBAR — Desktop                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full z-10 transition-all duration-300 ease-in-out",
          "border-r border-sidebar-border relative overflow-hidden",
          isCollapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Ambient glow (dark mode only) */}
        <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15 pointer-events-none" />
        <div className="absolute bottom-20 -left-10 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl dark:bg-purple-500/10 pointer-events-none" />

        {/* Logo Area */}
        <div className={cn(
          "h-16 flex items-center gap-3 px-4 relative z-10 shrink-0",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className={cn(
            "rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
            "bg-gradient-to-br from-violet-600 to-purple-700",
            "shadow-[0_4px_16px_rgba(139,92,246,0.35)]",
            "dark:shadow-[0_0_20px_rgba(139,92,246,0.50),0_0_40px_rgba(139,92,246,0.15)]",
            isCollapsed ? "w-9 h-9" : "w-9 h-9"
          )}>
            <TrendingUp className="w-[18px] h-[18px] text-white" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-lg text-foreground tracking-tight"
            >
              TradeLog
            </motion.span>
          )}
        </div>

        {/* Add Trade Button */}
        <div className="px-3 py-4 relative z-10 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddTradeOpen(true)}
            className={cn(
              "rounded-xl flex items-center justify-center text-white transition-all",
              "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700",
              "hover:from-violet-500 hover:via-purple-500 hover:to-violet-600",
              "shadow-[0_4px_16px_rgba(139,92,246,0.35)]",
              "hover:shadow-[0_6px_24px_rgba(139,92,246,0.50)]",
              "dark:shadow-[0_4px_20px_rgba(139,92,246,0.40)]",
              "dark:hover:shadow-[0_6px_30px_rgba(139,92,246,0.55)]",
              isCollapsed ? "w-10 h-10 mx-auto" : "w-full py-2.5 px-4 gap-2"
            )}
          >
            <Plus className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm font-bold">Add Trade</span>}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pt-2 overflow-y-auto no-scrollbar relative z-10 space-y-0.5">
          {/* Main Section Label */}
          {!isCollapsed ? (
            <p className="px-3 mb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Main</p>
          ) : (
            <div className="my-2" />
          )}

          {MAIN_NAV.map(item => renderNavItem(item))}

          {/* Divider */}
          <div className={cn(
            "my-4 relative",
            isCollapsed ? "mx-2" : "mx-3"
          )}>
            <div className="h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-border dark:to-transparent" />
          </div>

          {/* Tools Section Label */}
          {!isCollapsed ? (
            <p className="px-3 mb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Tools</p>
          ) : null}

          {TOOLS_NAV.map(item => renderNavItem(item))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 space-y-1 relative z-10 shrink-0">
          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center w-full rounded-xl transition-all h-10 px-3 relative",
              isCollapsed ? "justify-center" : "gap-3",
              isActive("/settings")
                ? "text-primary bg-primary/10 dark:bg-primary/12 font-semibold border border-primary/20 dark:border-primary/25"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="text-[13px] font-medium">Settings</span>}
          </Link>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex items-center w-full text-muted-foreground/50 hover:text-foreground/70",
              "transition-colors h-10 px-3 rounded-xl hover:bg-muted/30",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            {isCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            {!isCollapsed && <span className="text-[13px] font-medium">Collapse</span>}
          </button>

          {/* User divider */}
          <div className="h-px bg-border dark:bg-gradient-to-r dark:from-transparent dark:via-border dark:to-transparent mx-1 my-2" />

          {/* User profile */}
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-2 py-1")}>
            <div className={cn(
              "rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20 dark:ring-primary/30",
              isCollapsed ? "w-8 h-8" : "w-9 h-9"
            )}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(settings?.displayName || "T")}&background=7c3aed&color=fff&bold=true`}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden text-left flex-1">
                <span className="text-xs font-bold text-foreground truncate">{settings?.displayName || "Trader"}</span>
                <span className="text-[10px] text-muted-foreground/60 text-left font-semibold">Active Session</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT AREA                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Mobile Header */}
        <header className={cn(
          "md:hidden flex items-center justify-between p-4 z-20",
          "bg-card/80 backdrop-blur-xl border-b border-border",
          "dark:bg-card/60"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-gradient-to-br from-violet-600 to-purple-700",
              "shadow-[0_2px_8px_rgba(139,92,246,0.35)]"
            )}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">TradeLog</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => setIsAddTradeOpen(true)}
            >
              <Plus className="w-4 h-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute top-[57px] left-0 w-full z-30 md:hidden",
                "bg-card/95 backdrop-blur-2xl border-b border-border shadow-2xl"
              )}
            >
              <nav className="flex flex-col p-3 gap-0.5 max-h-[70vh] overflow-y-auto">
                {[...MAIN_NAV, ...TOOLS_NAV, ...PERF_NAV].map((item) => (
                  <Link
                    key={`${item.path}-${item.label}`}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-sm transition-all",
                      isActive(item.path)
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background transition-colors duration-400">
          <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <AddTradeModal open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} />
      <RiskCalculator open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen} />
      <AIAssistant />
    </div>
  );
}
