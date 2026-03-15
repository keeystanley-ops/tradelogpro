import { useState, useMemo } from "react";
import { useGetTrades } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/formatters";
import TradeDrawer from "@/components/TradeDrawer";
import {
  SlidersHorizontal, CalendarDays, ChevronDown, Settings2,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

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
  return (
    <div style={{ width: 80, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#spGrad)" dot={false} />
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
  const color = value >= 2 ? "#10b981" : value >= 1 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
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
  const color = pct >= 60 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <svg width={72} height={42} viewBox="0 0 72 42">
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${angleToXY(0).x} ${angleToXY(0).y}`}
          fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/20" />
        {pct > 0 && (
          <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
            fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
        )}
      </svg>
      <div className="flex items-center gap-2 text-[10px] mt-1">
        <span className="text-emerald-500 font-semibold">{wins}</span>
        <span className="text-muted-foreground">{breakevens}</span>
        <span className="text-red-500 font-semibold">{losses}</span>
      </div>
    </div>
  );
}

/* ── Win/Loss Bar ── */
function WinLossBar({ avgWin, avgLoss }: { avgWin: number; avgLoss: number }) {
  const total = avgWin + avgLoss;
  const winPct = total > 0 ? (avgWin / total) * 100 : 50;
  return (
    <div className="w-full mt-2">
      <div className="flex rounded-full overflow-hidden h-2">
        <div style={{ width: `${winPct}%` }} className="bg-emerald-500" />
        <div style={{ width: `${100 - winPct}%` }} className="bg-red-500" />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-emerald-500 font-medium">${avgWin.toFixed(0)}</span>
        <span className="text-red-500 font-medium">-${avgLoss.toFixed(0)}</span>
      </div>
    </div>
  );
}

/* ── Zella Scale Bar ── */
function ZellaScaleBar({ roi }: { roi: number }) {
  const score = Math.min(Math.abs(roi) * 5, 100);
  const color = roi >= 0 ? "#10b981" : "#ef4444";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div style={{ width: `${score}%`, background: color }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

/* ── Sort Icon ── */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey || sortDir === "none") return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
  return sortDir === "asc"
    ? <ArrowUp className="w-3 h-3 ml-1 text-primary inline" />
    : <ArrowDown className="w-3 h-3 ml-1 text-primary inline" />;
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
    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => handleSort(col)}>
      {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-semibold">Trade Log</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {(symbolFilter || statusFilter !== "ALL") && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Symbol</p>
                <input
                  className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. AAPL"
                  value={symbolFilter}
                  onChange={e => { setSymbolFilter(e.target.value); setPage(1); }}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
                <div className="flex gap-1.5">
                  {(["ALL", "WIN", "LOSS"] as const).map(s => (
                    <button key={s}
                      className={`flex-1 text-xs py-1 rounded-md border transition-colors ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      onClick={() => { setStatusFilter(s); setPage(1); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs h-7"
                onClick={() => { setSymbolFilter(""); setStatusFilter("ALL"); setPage(1); }}>
                Clear filters
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <CalendarDays className="w-3.5 h-3.5" />
                {dateRange}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["Today", "This week", "This month", "Last 3 months", "This year", "All time"].map(r => (
                <DropdownMenuItem key={r} onSelect={() => setDateRange(r)} className={dateRange === r ? "text-primary font-medium" : ""}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-border">
                <User className="w-3.5 h-3.5" />
                Demo account
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-primary font-medium">Demo account</DropdownMenuItem>
              <DropdownMenuItem>Live account</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Net P&L */}
        <div className="glass-panel rounded-xl p-4 border border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Net cumulative P&L
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted/40 text-[10px]">
              {allTrades.length}
            </span>
          </p>
          <p className={`text-2xl font-display font-bold ${metrics.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {formatMoney(metrics.netPnl)}
          </p>
          <div className="mt-2">
            <Sparkline data={metrics.cumulative} />
          </div>
        </div>

        {/* Profit Factor */}
        <div className="glass-panel rounded-xl p-4 border border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Profit factor</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-display font-bold">{metrics.profitFactor.toFixed(2)}</p>
            <RingGauge value={metrics.profitFactor} />
          </div>
        </div>

        {/* Win Rate */}
        <div className="glass-panel rounded-xl p-4 border border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Trade win %</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-display font-bold">{metrics.winRate.toFixed(2)}%</p>
            <ArcGauge pct={metrics.winRate} wins={metrics.wins} breakevens={metrics.breakevens} losses={metrics.losses} />
          </div>
        </div>

        {/* Avg Win/Loss */}
        <div className="glass-panel rounded-xl p-4 border border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Avg win/loss trade</p>
          <p className="text-2xl font-display font-bold">{metrics.ratio.toFixed(2)}</p>
          <WinLossBar avgWin={metrics.avgWin} avgLoss={metrics.avgLoss} />
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel rounded-xl border border-border/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-b border-border/60">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" disabled={selectedRows.size === 0}>
                Bulk actions <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export selected</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Delete selected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/60">
                <tr className="bg-muted/20">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="rounded"
                      checked={paged.length > 0 && selectedRows.size === paged.length}
                      onChange={toggleAll} />
                  </th>
                  <ThSort col="entryTime" label="Open date" />
                  <ThSort col="symbol" label="Symbol" />
                  <ThSort col="status" label="Status" />
                  <ThSort col="exitTime" label="Close date" />
                  <ThSort col="entryPrice" label="Entry price" />
                  <ThSort col="exitPrice" label="Exit price" />
                  <ThSort col="netPnl" label="Net P&L" />
                  <ThSort col="roi" label="Net ROI" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Zella Insights</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Zella Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paged.map((trade) => {
                  const isWin = trade._net >= 0;
                  const selected = selectedRows.has(trade.id);
                  return (
                    <tr key={trade.id}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${selected ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedTradeId(trade.id)}>
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleRow(trade.id); }}>
                        <input type="checkbox" className="rounded" checked={selected} onChange={() => toggleRow(trade.id)} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(trade.entryTime)}</td>
                      <td className="px-4 py-3 font-semibold text-foreground uppercase">{trade.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${isWin
                          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                          : "bg-red-500/15 text-red-500 border border-red-500/20"}`}>
                          {isWin ? "WIN" : "LOSS"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(trade.exitTime)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{formatPrice(trade.entryPrice)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{formatPrice(trade.exitPrice)}</td>
                      <td className={`px-4 py-3 font-mono font-semibold text-xs ${isWin ? "text-emerald-500" : "text-red-500"}`}>
                        {isWin ? "+" : ""}{formatMoney(trade.netPnl)}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs font-medium ${isWin ? "text-emerald-500" : "text-red-500"}`}>
                        {formatPct(trade._roi)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">—</td>
                      <td className="px-4 py-3">
                        <ZellaScaleBar roi={trade._roi} />
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                      No trades match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Trades per page:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  {pageSize} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {PAGE_SIZES.map(s => (
                  <DropdownMenuItem key={s} onSelect={() => { setPageSize(s); setPage(1); }}
                    className={pageSize === s ? "text-primary font-medium" : ""}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span>
              {trades.length === 0 ? "0" : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, trades.length)}`} of {trades.length} trades
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs min-w-[60px]">
                  {page} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-48 overflow-y-auto">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <DropdownMenuItem key={p} onSelect={() => setPage(p)}
                    className={page === p ? "text-primary font-medium" : ""}>
                    Page {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-xs text-muted-foreground">of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7"
              disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7"
              disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <TradeDrawer tradeId={selectedTradeId} onClose={() => setSelectedTradeId(null)} />
    </div>
  );
}
