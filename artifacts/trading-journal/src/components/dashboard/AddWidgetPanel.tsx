import { useState } from "react";
import { 
  X, Plus, BarChart3, PieChart, Activity, DollarSign, Target, Baseline,
  Wallet, ShieldCheck, Zap, Calendar, TrendingUp, Clock, Trophy, 
  AlertTriangle, BookOpen, Flame, LayoutGrid, Sparkles, ArrowRight,
  Globe, LineChart, ListChecks, Star, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/hooks/use-dashboard";
import type { Layout } from "react-grid-layout";

// ─── WIDGET CATALOG ───────────────────────────────────────────
interface WidgetCatalogItem {
  type: string;
  title: string;
  desc: string;
  icon: any;
  w: number;
  h: number;
  minW: number;
  minH: number;
  category: "metrics" | "charts" | "tables" | "advanced";
  isNew?: boolean;
}

const WIDGET_CATALOG: WidgetCatalogItem[] = [
  // Metrics
  { type: "NetPnl", title: "Net P&L", desc: "Total realized profit and loss after fees.", icon: Wallet, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "TradeExpectancy", title: "Expectancy", desc: "Average expected win/loss per trade.", icon: Target, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "ProfitFactor", title: "Profit Factor", desc: "Ratio of gross profit to gross loss.", icon: Activity, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "WinRate", title: "Win Rate", desc: "Percentage of profitable trades.", icon: ShieldCheck, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "AvgWinLoss", title: "Risk/Reward", desc: "Ratio of average win to average loss.", icon: Zap, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "CurrentStreak", title: "Current Streak", desc: "Your active winning or losing streak.", icon: Flame, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "AccountBalance", title: "Account Balance", desc: "Total value of your trading account.", icon: DollarSign, w: 2, h: 3, minW: 2, minH: 2, category: "metrics" },
  { type: "TotalTrades", title: "Total Trades", desc: "Number of trades taken this period.", icon: ListChecks, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "BestTrade", title: "Best Trade", desc: "Your largest single winning trade.", icon: Trophy, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "WorstTrade", title: "Worst Trade", desc: "Your largest single losing trade.", icon: AlertTriangle, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "AvgHoldTime", title: "Avg Hold Time", desc: "Average time a trade is held.", icon: Clock, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "LargestDrawdown", title: "Max Drawdown", desc: "Your largest peak-to-trough decline.", icon: TrendingUp, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "AvgRMultiple", title: "Avg R-Multiple", desc: "Average risk-adjusted return per trade.", icon: Percent, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },
  { type: "ConsecutiveWins", title: "Best Win Streak", desc: "Your longest consecutive winning streak.", icon: Star, w: 2, h: 3, minW: 2, minH: 2, category: "metrics", isNew: true },

  // Charts
  { type: "ZellaScore", title: "Trading Score", desc: "Your comprehensive trading performance radar.", icon: Activity, w: 4, h: 6, minW: 3, minH: 4, category: "charts" },
  { type: "EquityCurve", title: "Equity Curve", desc: "Cumulative P&L over time.", icon: LineChart, w: 4, h: 6, minW: 3, minH: 4, category: "charts" },
  { type: "PnlChart", title: "Daily P&L Chart", desc: "Bar chart of daily profit and loss.", icon: BarChart3, w: 4, h: 6, minW: 3, minH: 4, category: "charts" },
  { type: "WinRateByDay", title: "Win Rate by Day", desc: "Performance breakdown by day of the week.", icon: PieChart, w: 4, h: 6, minW: 3, minH: 4, category: "charts", isNew: true },
  { type: "PnlDistribution", title: "P&L Distribution", desc: "Histogram of trade outcomes.", icon: BarChart3, w: 4, h: 6, minW: 3, minH: 4, category: "charts", isNew: true },
  { type: "HourlyPerformance", title: "Hourly Heatmap", desc: "Performance by hour of the day.", icon: Globe, w: 4, h: 6, minW: 3, minH: 4, category: "charts", isNew: true },

  // Tables
  { type: "TradesTable", title: "Recent Trades", desc: "List of recently closed trades.", icon: BookOpen, w: 6, h: 8, minW: 4, minH: 5, category: "tables" },
  { type: "Calendar", title: "Performance Calendar", desc: "Monthly view of daily performance.", icon: Calendar, w: 8, h: 8, minW: 6, minH: 5, category: "tables" },
  { type: "TopSymbols", title: "Top Symbols", desc: "Ranking of your most traded symbols.", icon: Star, w: 4, h: 6, minW: 3, minH: 4, category: "tables", isNew: true },

  // Advanced
  { type: "MarketNotes", title: "Market Notes", desc: "Quick-access notepad for market observations.", icon: BookOpen, w: 4, h: 6, minW: 3, minH: 4, category: "advanced", isNew: true },
  { type: "RiskExposure", title: "Risk Exposure", desc: "Current risk profile and position sizing.", icon: ShieldCheck, w: 4, h: 4, minW: 3, minH: 3, category: "advanced", isNew: true },
];

// ─── PRESET TEMPLATES ─────────────────────────────────────────
interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  accentColor: string;
  tags: string[];
  widgets: WidgetConfig[];
  layouts: { [key: string]: Layout[] };
}

const PRESETS: DashboardPreset[] = [
  {
    id: "quick-overview",
    name: "Quick Overview",
    description: "A minimal, focused view for busy traders. See your key metrics and recent trades at a glance.",
    icon: Zap,
    accentColor: "from-emerald-500 to-cyan-500",
    tags: ["Beginner", "Minimal"],
    widgets: [
      { id: "netPnl", type: "NetPnl", w: 2, h: 3, title: "Net P&L" },
      { id: "winRate", type: "WinRate", w: 2, h: 3, title: "Win %" },
      { id: "expectancy", type: "TradeExpectancy", w: 2, h: 3, title: "Expectancy" },
      { id: "currentStreak", type: "CurrentStreak", w: 2, h: 3, title: "Current Streak" },
      { id: "accountBalance", type: "AccountBalance", w: 2, h: 3, title: "Balance" },
      { id: "profitFactor", type: "ProfitFactor", w: 2, h: 3, title: "Profit Factor" },
      { id: "tradesTable", type: "TradesTable", w: 6, h: 8, minW: 4, minH: 5, title: "Recent Trades" },
      { id: "equityCurve", type: "EquityCurve", w: 6, h: 8, minW: 3, minH: 4, title: "Equity Curve" },
    ],
    layouts: {
      lg: [
        { i: "netPnl", x: 0, y: 0, w: 2, h: 3 },
        { i: "winRate", x: 2, y: 0, w: 2, h: 3 },
        { i: "expectancy", x: 4, y: 0, w: 2, h: 3 },
        { i: "currentStreak", x: 6, y: 0, w: 2, h: 3 },
        { i: "accountBalance", x: 8, y: 0, w: 2, h: 3 },
        { i: "profitFactor", x: 10, y: 0, w: 2, h: 3 },
        { i: "tradesTable", x: 0, y: 3, w: 6, h: 8 },
        { i: "equityCurve", x: 6, y: 3, w: 6, h: 8 },
      ]
    }
  },
  {
    id: "pro-trader",
    name: "Pro Trader",
    description: "Full analytical dashboard with charts, score radar, calendar, and all key metrics for serious traders.",
    icon: Trophy,
    accentColor: "from-violet-500 to-purple-600",
    tags: ["Advanced", "Full"],
    widgets: [
      { id: "netPnl", type: "NetPnl", w: 2, h: 3, title: "Net P&L" },
      { id: "expectancy", type: "TradeExpectancy", w: 2, h: 3, title: "Expectancy" },
      { id: "profitFactor", type: "ProfitFactor", w: 2, h: 3, title: "Profit Factor" },
      { id: "currentStreak", type: "CurrentStreak", w: 2, h: 3, title: "Current Streak" },
      { id: "accountBalance", type: "AccountBalance", w: 2, h: 3, title: "Balance" },
      { id: "winRate", type: "WinRate", w: 2, h: 3, title: "Win %" },
      { id: "zellaScore", type: "ZellaScore", w: 4, h: 6, minW: 3, minH: 4, title: "Trading Score" },
      { id: "equityCurve", type: "EquityCurve", w: 4, h: 6, minW: 3, minH: 4, title: "Equity Curve" },
      { id: "pnlBar", type: "PnlChart", w: 4, h: 6, minW: 3, minH: 4, title: "P&L Chart" },
      { id: "tradesTable", type: "TradesTable", w: 6, h: 8, minW: 4, minH: 5, title: "Recent Trades" },
      { id: "calendar", type: "Calendar", w: 6, h: 8, minW: 5, minH: 5, title: "Performance Calendar" },
      { id: "avgWinLoss", type: "AvgWinLoss", w: 3, h: 3, title: "Risk/Reward" },
    ],
    layouts: {
      lg: [
        { i: "netPnl", x: 0, y: 0, w: 2, h: 3 },
        { i: "expectancy", x: 2, y: 0, w: 2, h: 3 },
        { i: "profitFactor", x: 4, y: 0, w: 2, h: 3 },
        { i: "currentStreak", x: 6, y: 0, w: 2, h: 3 },
        { i: "accountBalance", x: 8, y: 0, w: 2, h: 3 },
        { i: "winRate", x: 10, y: 0, w: 2, h: 3 },
        { i: "zellaScore", x: 0, y: 3, w: 4, h: 6 },
        { i: "equityCurve", x: 4, y: 3, w: 4, h: 6 },
        { i: "pnlBar", x: 8, y: 3, w: 4, h: 6 },
        { i: "tradesTable", x: 0, y: 9, w: 6, h: 8 },
        { i: "calendar", x: 6, y: 9, w: 6, h: 8 },
        { i: "avgWinLoss", x: 0, y: 17, w: 3, h: 3 },
      ]
    }
  },
  {
    id: "risk-focused",
    name: "Risk Manager",
    description: "Focus on risk metrics, drawdowns, streaks, and position sizing. Built for capital preservation.",
    icon: ShieldCheck,
    accentColor: "from-amber-500 to-orange-500",
    tags: ["Intermediate", "Risk"],
    widgets: [
      { id: "accountBalance", type: "AccountBalance", w: 2, h: 3, title: "Balance" },
      { id: "netPnl", type: "NetPnl", w: 2, h: 3, title: "Net P&L" },
      { id: "profitFactor", type: "ProfitFactor", w: 2, h: 3, title: "Profit Factor" },
      { id: "avgWinLoss", type: "AvgWinLoss", w: 2, h: 3, title: "Risk/Reward" },
      { id: "currentStreak", type: "CurrentStreak", w: 2, h: 3, title: "Current Streak" },
      { id: "maxDrawdown", type: "LargestDrawdown", w: 2, h: 3, title: "Max Drawdown" },
      { id: "equityCurve", type: "EquityCurve", w: 6, h: 6, minW: 3, minH: 4, title: "Equity Curve" },
      { id: "pnlBar", type: "PnlChart", w: 6, h: 6, minW: 3, minH: 4, title: "Daily P&L" },
      { id: "calendar", type: "Calendar", w: 12, h: 8, minW: 6, minH: 5, title: "Performance Calendar" },
    ],
    layouts: {
      lg: [
        { i: "accountBalance", x: 0, y: 0, w: 2, h: 3 },
        { i: "netPnl", x: 2, y: 0, w: 2, h: 3 },
        { i: "profitFactor", x: 4, y: 0, w: 2, h: 3 },
        { i: "avgWinLoss", x: 6, y: 0, w: 2, h: 3 },
        { i: "currentStreak", x: 8, y: 0, w: 2, h: 3 },
        { i: "maxDrawdown", x: 10, y: 0, w: 2, h: 3 },
        { i: "equityCurve", x: 0, y: 3, w: 6, h: 6 },
        { i: "pnlBar", x: 6, y: 3, w: 6, h: 6 },
        { i: "calendar", x: 0, y: 9, w: 12, h: 8 },
      ]
    }
  },
  {
    id: "journal-focused",
    name: "Journaling View",
    description: "Compact metrics with a big calendar and trade log. Perfect for daily reflection and journaling.",
    icon: BookOpen,
    accentColor: "from-blue-500 to-indigo-600",
    tags: ["Beginner", "Journal"],
    widgets: [
      { id: "netPnl", type: "NetPnl", w: 3, h: 3, title: "Net P&L" },
      { id: "winRate", type: "WinRate", w: 3, h: 3, title: "Win %" },
      { id: "currentStreak", type: "CurrentStreak", w: 3, h: 3, title: "Current Streak" },
      { id: "accountBalance", type: "AccountBalance", w: 3, h: 3, title: "Balance" },
      { id: "calendar", type: "Calendar", w: 7, h: 10, minW: 6, minH: 5, title: "Performance Calendar" },
      { id: "tradesTable", type: "TradesTable", w: 5, h: 10, minW: 4, minH: 5, title: "Recent Trades" },
    ],
    layouts: {
      lg: [
        { i: "netPnl", x: 0, y: 0, w: 3, h: 3 },
        { i: "winRate", x: 3, y: 0, w: 3, h: 3 },
        { i: "currentStreak", x: 6, y: 0, w: 3, h: 3 },
        { i: "accountBalance", x: 9, y: 0, w: 3, h: 3 },
        { i: "calendar", x: 0, y: 3, w: 7, h: 10 },
        { i: "tradesTable", x: 7, y: 3, w: 5, h: 10 },
      ]
    }
  },
  {
    id: "chart-heavy",
    name: "Chart Analyst",
    description: "Multiple chart views side by side for visual analysis and pattern spotting.",
    icon: LineChart,
    accentColor: "from-pink-500 to-rose-500",
    tags: ["Advanced", "Visual"],
    widgets: [
      { id: "netPnl", type: "NetPnl", w: 2, h: 3, title: "Net P&L" },
      { id: "winRate", type: "WinRate", w: 2, h: 3, title: "Win %" },
      { id: "profitFactor", type: "ProfitFactor", w: 2, h: 3, title: "Profit Factor" },
      { id: "accountBalance", type: "AccountBalance", w: 2, h: 3, title: "Balance" },
      { id: "expectancy", type: "TradeExpectancy", w: 2, h: 3, title: "Expectancy" },
      { id: "avgWinLoss", type: "AvgWinLoss", w: 2, h: 3, title: "Risk/Reward" },
      { id: "equityCurve", type: "EquityCurve", w: 4, h: 6, minW: 3, minH: 4, title: "Equity Curve" },
      { id: "pnlBar", type: "PnlChart", w: 4, h: 6, minW: 3, minH: 4, title: "Daily P&L" },
      { id: "zellaScore", type: "ZellaScore", w: 4, h: 6, minW: 3, minH: 4, title: "Trading Score" },
    ],
    layouts: {
      lg: [
        { i: "netPnl", x: 0, y: 0, w: 2, h: 3 },
        { i: "winRate", x: 2, y: 0, w: 2, h: 3 },
        { i: "profitFactor", x: 4, y: 0, w: 2, h: 3 },
        { i: "accountBalance", x: 6, y: 0, w: 2, h: 3 },
        { i: "expectancy", x: 8, y: 0, w: 2, h: 3 },
        { i: "avgWinLoss", x: 10, y: 0, w: 2, h: 3 },
        { i: "equityCurve", x: 0, y: 3, w: 4, h: 6 },
        { i: "pnlBar", x: 4, y: 3, w: 4, h: 6 },
        { i: "zellaScore", x: 8, y: 3, w: 4, h: 6 },
      ]
    }
  },
];

// ─── CATEGORIES ───────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", label: "All Widgets", icon: LayoutGrid },
  { key: "metrics", label: "Metrics", icon: DollarSign },
  { key: "charts", label: "Charts", icon: BarChart3 },
  { key: "tables", label: "Tables & Lists", icon: ListChecks },
  { key: "advanced", label: "Advanced", icon: Sparkles },
];

// ─── COMPONENT ────────────────────────────────────────────────
export function AddWidgetPanel({
  open,
  onOpenChange,
  onAdd,
  onApplyPreset
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: string, defaults: any) => void;
  onApplyPreset?: (preset: { widgets: WidgetConfig[]; layouts: { [key: string]: Layout[] } }) => void;
}) {
  const [tab, setTab] = useState<"presets" | "widgets">("presets");
  const [category, setCategory] = useState("all");
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  const filteredWidgets = category === "all" 
    ? WIDGET_CATALOG 
    : WIDGET_CATALOG.filter(w => w.category === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-2 border-slate-100 dark:border-white/10 p-0 rounded-[2rem] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              Customize Dashboard
            </DialogTitle>
          </DialogHeader>
          
          {/* Tab Switcher */}
          <div className="flex gap-1 mt-4 bg-slate-50 dark:bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setTab("presets")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all",
                tab === "presets"
                  ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              Smart Presets
            </button>
            <button
              onClick={() => setTab("widgets")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all",
                tab === "widgets"
                  ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              Individual Widgets
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto">
          
          {/* ─── PRESETS TAB ─── */}
          {tab === "presets" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Choose a recommended layout. This will replace all current widgets with the selected preset.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onMouseEnter={() => setHoveredPreset(preset.id)}
                    onMouseLeave={() => setHoveredPreset(null)}
                    className={cn(
                      "group relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                      hoveredPreset === preset.id
                        ? "border-primary/30 bg-primary/[0.02]"
                        : "border-slate-100 dark:border-white/5 bg-card hover:border-primary/15"
                    )}
                  >
                    {/* Accent gradient bar */}
                    <div className={cn(
                      "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                      preset.accentColor
                    )} />
                    
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110",
                        preset.accentColor
                      )}>
                        <preset.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold">{preset.name}</h4>
                          {preset.tags.map(tag => (
                            <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{preset.description}</p>
                        <div className="flex items-center gap-3 mt-2.5">
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {preset.widgets.length} widgets
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {preset.widgets.filter(w => ["NetPnl","WinRate","ProfitFactor","TradeExpectancy","AvgWinLoss","CurrentStreak","AccountBalance","TotalTrades","BestTrade","WorstTrade","AvgHoldTime","LargestDrawdown","AvgRMultiple","ConsecutiveWins"].includes(w.type)).length} metrics
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {preset.widgets.filter(w => ["ZellaScore","EquityCurve","PnlChart","WinRateByDay","PnlDistribution","HourlyPerformance"].includes(w.type)).length} charts
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyPreset?.(preset);
                          onOpenChange(false);
                        }}
                        className="shrink-0 h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 transition-all"
                      >
                        Apply <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── WIDGETS TAB ─── */}
          {tab === "widgets" && (
            <div className="space-y-4">
              {/* Category filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all",
                      category === cat.key
                        ? "bg-violet-500 text-white shadow-sm"
                        : "bg-slate-50 dark:bg-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                  >
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Widget grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredWidgets.map((item) => (
                  <div
                    key={item.type}
                    className="group p-4 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-card hover:border-primary/20 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-500 transition-colors shrink-0">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold truncate">{item.title}</h4>
                          {item.isNew && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight truncate">{item.desc}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs font-bold border-slate-100 dark:border-white/5 hover:bg-violet-500 hover:text-white hover:border-transparent rounded-xl transition-all"
                      onClick={() => {
                        onAdd(item.type, { title: item.title, w: item.w, h: item.h, minW: item.minW, minH: item.minH });
                        onOpenChange(false);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Widget
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
