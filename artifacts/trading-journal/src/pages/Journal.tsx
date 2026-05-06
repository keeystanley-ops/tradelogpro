import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGetTrades } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/formatters";
import TradeDrawer from "@/components/TradeDrawer";
import {
  SlidersHorizontal, CalendarDays, ChevronDown, Settings2,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, User,
  Sparkles, TrendingUp, Target, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type SortKey = "entryTime" | "symbol" | "status" | "exitTime" | "entryPrice" | "exitPrice" | "netPnl" | "roi";
type SortDir = "asc" | "desc" | "none";

function formatDate(ts: string | Date | null | undefined) {
  if (!ts) return "—";
  const d = new Date(ts as string);
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatPrice(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? "0"));
  if (isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(v: number) {
  const sign = v >= 0 ? "+" : "";
  return sign + v.toFixed(2) + "%";
}

function parseN(v: any): number { return parseFloat(v) || 0; }

/* ── Sparkline ── */
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const pts = data.map((v, i) => ({ v }));
  const isProfit = data[data.length - 1] >= data[0];
  const color = isProfit ? "hsl(var(--profit))" : "hsl(var(--loss))";

  return (
    <div style={{ width: 100, height: 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id="spGradJournal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="v" 
            stroke={color} 
            strokeWidth={2} 
            fill="url(#spGradJournal)" 
            dot={false} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Ring Gauge (Profit Factor) ── */
function RingGauge({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const r = 22, cx = 28, cy = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = value >= 2 ? "hsl(var(--profit))" : value >= 1 ? "hsl(var(--chart-3))" : "hsl(var(--loss))";
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" className="text-[10px] font-bold fill-foreground">
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

/* ── Arc Gauge (Win Rate) ── */
function ArcGauge({ pct, wins, breakevens, losses }: { pct: number; wins: number; breakevens: number; losses: number }) {
  const r = 28, cx = 36, cy = 36;
  const startAngle = -180, sweepAngle = 180;
  const angleToXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const s = angleToXY(startAngle);
  const e = angleToXY(startAngle + sweepAngle * Math.min(pct / 100, 1));
  const large = sweepAngle * Math.min(pct / 100, 1) > 180 ? 1 : 0;
  const color = pct >= 60 ? "hsl(var(--profit))" : pct >= 40 ? "hsl(var(--chart-3))" : "hsl(var(--loss))";
  return (
    <div className="flex flex-col items-center">
      <svg width={72} height={42} viewBox="0 0 72 42">
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${angleToXY(0).x} ${angleToXY(0).y}`}
          fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
        {pct > 0 && (
          <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
            fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" />
        )}
      </svg>
      <div className="flex items-center gap-1.5 text-[9px] mt-1 font-bold">
        <span className="text-profit">{wins}W</span>
        <span className="text-muted-foreground/60">{breakevens}B</span>
        <span className="text-loss">{losses}L</span>
      </div>
    </div>
  );
}

/* ── Win/Loss Bar ── */
function WinLossBar({ avgWin, avgLoss }: { avgWin: number; avgLoss: number }) {
  const total = Math.abs(avgWin) + Math.abs(avgLoss);
  const winPct = total > 0 ? (Math.abs(avgWin) / total) * 100 : 50;
  return (
    <div className="w-full mt-3">
      <div className="flex rounded-full overflow-hidden h-1.5 bg-muted/30">
        <div style={{ width: `${winPct}%` }} className="bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div style={{ width: `${100 - winPct}%` }} className="bg-gradient-to-r from-rose-500 to-red-400" />
      </div>
      <div className="flex justify-between text-[10px] mt-1.5 font-bold uppercase tracking-wider">
        <span className="text-profit">Avg ${avgWin.toFixed(0)}</span>
        <span className="text-loss">Avg ${avgLoss.toFixed(0)}</span>
      </div>
    </div>
  );
}

/* ── Zella Scale Bar ── */
function ZellaScaleBar({ roi }: { roi: number }) {
  const score = Math.min(Math.abs(roi) * 5, 100);
  const isPos = roi >= 0;
  const gradient = isPos 
    ? "linear-gradient(90deg, hsl(var(--profit)) 0%, hsl(var(--chart-5)) 100%)" 
    : "linear-gradient(90deg, hsl(var(--loss)) 0%, hsl(var(--chart-3)) 100%)";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div style={{ width: `${score}%`, background: gradient }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

/* ── Sort Icon ── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey || sortDir === "none") return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20 inline" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1 text-primary inline animate-in fade-in slide-in-from-bottom-1" />
    : <ArrowDown className="w-3 h-3 ml-1 text-primary inline animate-in fade-in slide-in-from-top-1" />;
}

const PAGE_SIZES = [10, 25, 50, 100];

export default function Journal() {
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("entryTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [symbolFilter, setSymbolFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [dateRange, setDateRange] = useState("All time");

  const { data: raw, isLoading } = useGetTrades({ limit: 500 });
  const allTrades = raw?.trades ?? [];

  const trades = useMemo(() => {
    let t = allTrades.map((tr) => {
      const net = parseN(tr.netPnl);
      const entry = parseN(tr.entryPrice);
      const qty = parseN(tr.quantity);
      const cost = entry * qty;
      const roi = cost > 0 ? (net / cost) * 100 : 0;
      return { ...tr, _net: net, _roi: roi, _status: net >= 0 ? "WIN" : "LOSS" };
    });
    if (symbolFilter) t = t.filter(tr => tr.symbol.toUpperCase().includes(symbolFilter.toUpperCase()));
    if (statusFilter !== "ALL") t = t.filter(tr => tr._status === statusFilter);
    if (sortDir !== "none") {
      t = [...t].sort((a, b) => {
        let av: any, bv: any;
        switch (sortKey) {
          case "entryTime": av = new Date(a.entryTime).getTime(); bv = new Date(b.entryTime).getTime(); break;
          case "exitTime": av = new Date(a.exitTime).getTime(); bv = new Date(b.exitTime).getTime(); break;
          case "symbol": av = a.symbol; bv = b.symbol; break;
          case "status": av = a._status; bv = b._status; break;
          case "entryPrice": av = parseN(a.entryPrice); bv = parseN(b.entryPrice); break;
          case "exitPrice": av = parseN(a.exitPrice); bv = parseN(b.exitPrice); break;
          case "netPnl": av = a._net; bv = b._net; break;
          case "roi": av = a._roi; bv = b._roi; break;
        }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return t;
  }, [allTrades, symbolFilter, statusFilter, sortKey, sortDir]);

  const metrics = useMemo(() => {
    const nets = trades.map(t => t._net);
    const cumulative: number[] = [];
    let running = 0;
    nets.forEach(n => { running += n; cumulative.push(running); });
    const netPnl = running;
    const wins = trades.filter(t => t._net > 0);
    const losses = trades.filter(t => t._net < 0);
    const breakevens = trades.filter(t => t._net === 0);
    const grossProfit = wins.reduce((a, t) => a + t._net, 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t._net, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 0;
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const ratio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 9.99 : 0;
    return { netPnl, cumulative, profitFactor, winRate, avgWin, avgLoss, ratio, wins: wins.length, losses: losses.length, breakevens: breakevens.length };
  }, [trades]);

  const totalPages = Math.max(1, Math.ceil(trades.length / pageSize));
  const paged = trades.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? "none" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function toggleRow(id: number) {
    setSelectedRows(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selectedRows.size === paged.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(paged.map(t => t.id)));
  }

  const ThSort = ({ col, label }: { col: SortKey; label: string }) => (
    <th className="px-5 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors group"
      onClick={() => handleSort(col)}>
      <span className="flex items-center">
        {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
            Trade Log
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review and analyze your execution history.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl gap-2 border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {(symbolFilter || statusFilter !== "ALL") && <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4 space-y-4 rounded-2xl border-border shadow-2xl glass-panel">
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Symbol Search</p>
                <input
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  placeholder="e.g. AAPL, BTCUSDT"
                  value={symbolFilter}
                  onChange={e => { setSymbolFilter(e.target.value); setPage(1); }}
                />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">Outcome Status</p>
                <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl">
                  {(["ALL", "WIN", "LOSS"] as const).map(s => (
                    <button key={s}
                      className={cn(
                        "flex-1 text-[10px] font-black py-2 rounded-lg transition-all",
                        statusFilter === s 
                          ? "bg-card shadow-sm text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => { setStatusFilter(s); setPage(1); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => { setSymbolFilter(""); setStatusFilter("ALL"); setPage(1); }}>
                Reset All Filters
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl gap-2 border-border bg-card/50 backdrop-blur-sm hover:border-primary/30">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{dateRange}</span>
                <ChevronDown className="w-3 h-3 opacity-30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl glass-panel">
              {["Today", "This week", "This month", "Last 3 months", "This year", "All time"].map(r => (
                <DropdownMenuItem key={r} onSelect={() => setDateRange(r)} 
                  className={cn("text-xs font-medium py-2.5 px-4", dateRange === r ? "text-primary bg-primary/10" : "")}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/settings">
            <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl border-border bg-card/50 backdrop-blur-sm hover:border-primary/30">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards - Premium Glossy Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Net P&L */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-panel relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <div className="p-5">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Net Cumulative P&L
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/40">{trades.length}</span>
            </div>
            <p className={cn(
              "text-3xl font-display font-black data-value",
              metrics.netPnl >= 0 ? "stat-glow-profit" : "stat-glow-loss"
            )}>
              {formatMoney(metrics.netPnl)}
            </p>
            <div className="mt-4 flex justify-center">
              <Sparkline data={metrics.cumulative} />
            </div>
          </div>
        </motion.div>

        {/* Profit Factor */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-panel relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-600 dark:shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          <div className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
                <Target className="w-3 h-3" />
                Profit Factor
              </span>
              <p className="text-3xl font-display font-black data-value text-foreground">
                {metrics.profitFactor.toFixed(2)}
              </p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-[9px] font-black text-primary uppercase tracking-wider">
                System Edge
              </div>
            </div>
            <div className="scale-110">
              <RingGauge value={metrics.profitFactor} />
            </div>
          </div>
        </motion.div>

        {/* Win Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card-panel relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          <div className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
                <BarChart3 className="w-3 h-3" />
                Historical Winrate
              </span>
              <p className="text-3xl font-display font-black data-value text-foreground">
                {metrics.winRate.toFixed(1)}%
              </p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[9px] font-black text-profit uppercase tracking-wider">
                Execution Quality
              </div>
            </div>
            <div className="scale-110 translate-y-1">
              <ArcGauge pct={metrics.winRate} wins={metrics.wins} breakevens={metrics.breakevens} losses={metrics.losses} />
            </div>
          </div>
        </motion.div>

        {/* Avg Win/Loss */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-panel relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-500 dark:shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
          <div className="p-5">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3" />
              Risk/Reward Ratio
            </span>
            <p className="text-3xl font-display font-black data-value text-foreground">
              1:{metrics.ratio.toFixed(2)}
            </p>
            <WinLossBar avgWin={metrics.avgWin} avgLoss={metrics.avgLoss} />
          </div>
        </motion.div>
      </div>

      {/* Main Table Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="glass-panel rounded-3xl border border-border shadow-2xl overflow-hidden relative"
      >
        {/* Glow effect for table */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-[80px] pointer-events-none" />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/10">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {selectedRows.size > 0 ? `${selectedRows.size} Selected` : "Select trades to edit"}
             </div>
             {selectedRows.size > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setSelectedRows(new Set())}>
                  Cancel
                </Button>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn(
                  "gap-2 text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-border px-4 transition-all",
                  selectedRows.size > 0 ? "bg-primary text-white border-none shadow-lg shadow-primary/20" : "bg-card"
                )} disabled={selectedRows.size === 0}>
                  Actions <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl glass-panel">
                <DropdownMenuItem className="text-[11px] font-bold py-2.5">Export Selection (CSV)</DropdownMenuItem>
                <DropdownMenuItem className="text-[11px] font-bold py-2.5 text-destructive">Delete Hardcopy</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin dark:shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Journal...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border/40">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" 
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-card transition-all"
                      checked={paged.length > 0 && selectedRows.size === paged.length}
                      onChange={toggleAll} />
                  </th>
                  <ThSort col="entryTime" label="Execution" />
                  <ThSort col="symbol" label="Ticker" />
                  <ThSort col="status" label="Outcome" />
                  <ThSort col="netPnl" label="Realized P&L" />
                  <ThSort col="roi" label="ROI" />
                  <th className="px-5 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Entry / Exit</th>
                  <th className="px-5 py-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Zella Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paged.map((trade, idx) => {
                  const isWin = trade._net >= 0;
                  const selected = selectedRows.has(trade.id);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      key={trade.id}
                      className={cn(
                        "group transition-all cursor-pointer relative",
                        selected ? "bg-primary/[0.04]" : "hover:bg-primary/[0.02]"
                      )}
                      onClick={() => setSelectedTradeId(trade.id)}
                    >
                      <td className="px-6 py-5" onClick={e => { e.stopPropagation(); toggleRow(trade.id); }}>
                        <input type="checkbox" 
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-card transition-all"
                          checked={selected} 
                          onChange={() => toggleRow(trade.id)} 
                        />
                      </td>
                      <td className="px-5 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-foreground">{formatDate(trade.entryTime)}</span>
                           <span className="text-[9px] text-muted-foreground/60 uppercase font-black uppercase tracking-wider">{new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                         <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] border border-border group-hover:border-primary/20 transition-all">
                               {trade.symbol.substring(0, 2)}
                            </div>
                            <span className="text-xs font-black tracking-tight group-hover:text-primary transition-colors">{trade.symbol}</span>
                         </div>
                      </td>
                      <td className="px-5 py-5">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all",
                          isWin
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:bg-rose-500/20"
                        )}>
                          {isWin ? <ArrowUp className="w-2.5 h-2.5 mr-1" /> : <ArrowDown className="w-2.5 h-2.5 mr-1" />}
                          {isWin ? "PROFIT" : "RE LOSS"}
                        </span>
                      </td>
                      <td className={cn(
                        "px-5 py-5 font-display font-black text-sm",
                        isWin ? "text-profit" : "text-loss whitespace-nowrap"
                      )}>
                        {isWin ? "+" : ""}{formatMoney(trade.netPnl)}
                      </td>
                      <td className={cn(
                        "px-5 py-5 font-display font-bold text-xs",
                        isWin ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {formatPct(trade._roi)}
                      </td>
                      <td className="px-5 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold font-mono text-muted-foreground">{formatPrice(trade.entryPrice)}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-rose-500" />
                              <span className="text-[10px] font-bold font-mono text-muted-foreground">{formatPrice(trade.exitPrice)}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <ZellaScaleBar roi={trade._roi} />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Improved Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-border/40 bg-muted/5 gap-4">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">
            <div className="flex items-center gap-3">
              <span>Per page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 min-w-[50px] rounded-lg border-border bg-card">
                    {pageSize} <ChevronDown className="w-3 h-3 ml-1 opacity-40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl glass-panel">
                  {PAGE_SIZES.map(s => (
                    <DropdownMenuItem key={s} onSelect={() => { setPageSize(s); setPage(1); }}
                      className={cn("text-[10px] font-bold font-black px-4", pageSize === s ? "text-primary bg-primary/10" : "")}>
                      {s} Rows
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span>
              {trades.length === 0 ? "Empty" : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, trades.length)} of ${trades.length}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border bg-card group"
                disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </Button>
              
              <div className="flex items-center px-4 h-9 bg-card border border-border rounded-xl text-xs font-bold text-foreground">
                Page {page} <span className="mx-1.5 opacity-30">of</span> {totalPages}
              </div>

              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border bg-card group"
                disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <TradeDrawer tradeId={selectedTradeId} onClose={() => setSelectedTradeId(null)} />
    </div>
  );
}
