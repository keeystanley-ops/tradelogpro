import { formatMoney, formatPercent } from "@/lib/formatters";
import MetricCard from "./MetricCard";
import RingChart from "./RingChart";
import GaugeChart from "./GaugeChart";
import WinLossBar from "./WinLossBar";
import EquityCurveCard from "./EquityCurveCard";
import PnlBarChart from "./PnlBarChart";
import ZellaScoreCard from "./ZellaScoreCard";
import TradesTable from "./TradesTable";
import DashboardCalendar from "./DashboardCalendar";
import { 
  Info, 
  TrendingUp, 
  Target, 
  PieChart, 
  Activity, 
  Zap, 
  Wallet,
  Calendar as CalendarIconLucide,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export function renderWidget(
  type: string,
  metrics: any,
  equityData: any,
  recentTradesData: any,
  calendarData: any,
  displayMode: "$" | "%",
  settings: any,
  onTradeClick: (id: number) => void
) {
  if (!metrics) metrics = {};
  if (!equityData) equityData = { points: [] };
  
  const radarData = [
    { axis: "Win Rate", value: metrics.winRate ?? 0 },
    { axis: "Avg W/L", value: ((metrics.avgWin ?? 0) / Math.abs(metrics.avgLoss || 1)) * 20 },
    { axis: "Profit Factor", value: (metrics.profitFactor ?? 0) * 30 },
  ];

  switch (type) {
    case "NetPnl":
      return (
        <MetricCard 
          className="h-full"
          label="Net P&L" 
          icon={<Wallet />}
          description={`Total from ${metrics.totalTrades ?? 0} trades`}
          value={displayMode === "$" 
            ? formatMoney(metrics.netPnl ?? 0) 
            : formatPercent((metrics.netPnl ?? 0) / 1000)
          }
          valueColor={(metrics.netPnl ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"}
          secondary={<div className="h-12 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden flex items-end"><div className="h-2/3 w-full bg-emerald-500/10 dark:bg-emerald-500/20" style={{ width: '100%' }}></div></div>}
        />
      );
    case "TradeExpectancy":
      return (
        <MetricCard 
          className="h-full"
          label="Expectancy" 
          icon={<Target />}
          description="Avg win per trade"
          value={displayMode === "$" 
            ? formatMoney(metrics.expectancy ?? 0) 
            : formatPercent((metrics.expectancy ?? 0) / 1000)
          }
          secondary={<div className="h-12 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden flex items-end"><div className="h-1/2 w-full bg-violet-500/10 dark:bg-violet-500/20" style={{ width: '70%' }}></div></div>}
        />
      );
    case "ProfitFactor":
      return (
        <MetricCard 
          className="h-full"
          label="Profit Factor" 
          icon={<Activity />}
          description="Gross profit/loss ratio"
          value={(metrics.profitFactor ?? 0).toFixed(2)}
          secondary={<GaugeChart value={metrics.profitFactor ?? 0} />}
        />
      );
    case "WinRate":
      return (
        <MetricCard 
          className="h-full"
          label="Win %" 
          icon={<ShieldCheck />}
          description={`Successful: ${metrics.winningTrades ?? 0}`}
          value={formatPercent(metrics.winRate ?? 0)}
          secondary={
            <div className="flex items-center gap-4">
              <RingChart percentage={metrics.winRate ?? 0} />
              <div className="flex flex-col text-[10px] font-bold">
                 <span className="text-emerald-500">+{metrics.winningTrades ?? 0}</span>
                 <span className="text-rose-500">-{metrics.losingTrades ?? 0}</span>
              </div>
            </div>
          }
        />
      );
    case "AvgWinLoss":
      return (
        <MetricCard 
          className="h-full"
          label="Risk/Reward" 
          icon={<Zap />}
          description="Actual avg ratio"
          value={((metrics.avgWin ?? 0) / Math.abs(metrics.avgLoss || 1)).toFixed(1)}
          secondary={
            <WinLossBar 
              avgWin={metrics.avgWin ?? 0} 
              avgLoss={metrics.avgLoss ?? 0} 
              ratio={(metrics.avgWin ?? 0) / Math.abs(metrics.avgLoss || 1)} 
            />
          }
        />
      );
    case "ZellaScore":
      return (
        <ZellaScoreCard 
          score={81} 
          change="+1" 
          radarData={radarData}
        />
      );
    case "EquityCurve":
      return (
        <div className="h-full w-full"><EquityCurveCard data={equityData.points} /></div>
      );
    case "PnlChart":
      return (
        <div className="h-full w-full"><PnlBarChart data={equityData.points} /></div>
      );
    case "TradesTable":
      return (
        <div className="h-full w-full overflow-hidden"><TradesTable 
          trades={recentTradesData?.trades || []} 
          onTradeClick={onTradeClick}
        /></div>
      );
    case "Calendar":
      return (
        <div className="h-full w-full overflow-hidden"><DashboardCalendar 
           data={calendarData?.days || []} 
           monthName={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
           onTradeClick={onTradeClick}
        /></div>
      );
    case "CurrentStreak":
      return (
        <MetricCard 
          className="h-full"
          label="Current Streak" 
          icon={<Activity />}
          description={metrics.currentStreakType ? `${metrics.currentStreakType} streak` : "No active streak"}
          value={`${metrics.currentStreak ?? 0}${metrics.currentStreakType === 'WIN' ? 'W' : metrics.currentStreakType === 'LOSS' ? 'L' : ''}`}
          valueColor={metrics.currentStreakType === "WIN" ? "text-emerald-500" : metrics.currentStreakType === "LOSS" ? "text-rose-500" : "text-muted-foreground"}
          secondary={<div className="h-12 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden flex items-end"><div className="h-1/3 w-full bg-blue-500/10 dark:bg-blue-500/20" style={{ width: '40%' }}></div></div>}
        />
      );
    case "AccountBalance":
      const startingBalance = parseFloat(settings?.startingBalance ?? "10000");
      const currentBalance = startingBalance + (metrics.netPnl ?? 0);
      return (
        <MetricCard 
          className="h-full"
          label="Balance" 
          icon={<Wallet />}
          description={`Starting: ${formatMoney(startingBalance)}`}
          value={formatMoney(currentBalance)}
          secondary={<div className="h-12 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden flex items-end"><div className="h-4/5 w-full bg-violet-500/10 dark:bg-violet-500/20" style={{ width: '90%' }}></div></div>}
        />
      );

    // ─── NEW METRIC WIDGETS ───────────────────────────────────
    case "TotalTrades":
      return (
        <MetricCard
          className="h-full"
          label="Total Trades"
          icon={<Activity />}
          description="All closed trades"
          value={metrics.totalTrades ?? 0}
          secondary={
            <div className="flex gap-3 text-[10px] font-bold">
              <span className="text-emerald-500">W: {metrics.winningTrades ?? 0}</span>
              <span className="text-rose-500">L: {metrics.losingTrades ?? 0}</span>
            </div>
          }
        />
      );
    case "BestTrade":
      return (
        <MetricCard
          className="h-full"
          label="Best Trade"
          icon={<TrendingUp />}
          description="Largest single win"
          value={formatMoney(metrics.bestTrade ?? 0)}
          valueColor="text-emerald-500"
        />
      );
    case "WorstTrade":
      return (
        <MetricCard
          className="h-full"
          label="Worst Trade"
          icon={<Activity />}
          description="Largest single loss"
          value={formatMoney(metrics.worstTrade ?? 0)}
          valueColor="text-rose-500"
        />
      );
    case "AvgHoldTime": {
      const seconds = metrics.avgDuration ?? 0;
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return (
        <MetricCard
          className="h-full"
          label="Avg Hold Time"
          icon={<Activity />}
          description="Per trade duration"
          value={timeStr}
        />
      );
    }
    case "LargestDrawdown":
      return (
        <MetricCard
          className="h-full"
          label="Max Drawdown"
          icon={<TrendingUp />}
          description="Peak-to-trough"
          value={formatMoney(metrics.maxDrawdown ?? 0)}
          valueColor="text-rose-500"
        />
      );
    case "AvgRMultiple":
      return (
        <MetricCard
          className="h-full"
          label="Avg R-Multiple"
          icon={<Activity />}
          description="Risk-adjusted return"
          value={`${(metrics.avgRMultiple ?? 0).toFixed(2)}R`}
          valueColor={(metrics.avgRMultiple ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"}
        />
      );
    case "ConsecutiveWins":
      return (
        <MetricCard
          className="h-full"
          label="Best Win Streak"
          icon={<Activity />}
          description="Consecutive wins"
          value={`${metrics.bestWinStreak ?? 0}W`}
          valueColor="text-emerald-500"
        />
      );

    // ─── NEW CHART / TABLE WIDGETS ────────────────────────────
    case "WinRateByDay":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-4">Win Rate by Day</h3>
          <div className="flex-1 flex items-end gap-2 pb-4">
            {["Mon","Tue","Wed","Thu","Fri"].map((d) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-emerald-500/15 dark:bg-emerald-500/25 rounded-lg transition-all" style={{ height: `${30 + Math.random()*50}%` }} />
                <span className="text-[9px] text-muted-foreground font-bold">{d}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "PnlDistribution":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-4">P&L Distribution</h3>
          <div className="flex-1 flex items-end gap-1 pb-4">
            {Array.from({ length: 12 }).map((_, i) => {
              const isLoss = i < 5;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className={`w-full rounded-lg ${isLoss ? "bg-rose-500/20" : "bg-emerald-500/20"}`}
                    style={{ height: `${10 + Math.random()*70}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
            <span>-$500</span><span>$0</span><span>+$500</span>
          </div>
        </div>
      );
    case "HourlyPerformance":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-4">Hourly Heatmap</h3>
          <div className="flex-1 grid grid-cols-6 grid-rows-4 gap-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const intensity = Math.random();
              const cls = intensity > 0.7 ? "bg-emerald-500/30 text-emerald-600" :
                intensity > 0.4 ? "bg-emerald-500/10 text-emerald-500/70" :
                intensity > 0.2 ? "bg-slate-100 dark:bg-white/5 text-muted-foreground" :
                "bg-rose-500/10 text-rose-500/70";
              return (
                <div key={i} className={`rounded-lg flex items-center justify-center text-[8px] font-bold ${cls}`}>
                  {i}h
                </div>
              );
            })}
          </div>
        </div>
      );
    case "TopSymbols":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-4">Top Symbols</h3>
          <div className="flex-1 space-y-2">
            {(metrics.topSymbols || ["SPY","AAPL","TSLA","QQQ"]).slice(0, 5).map((sym: string, i: number) => (
              <div key={sym} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="text-[10px] font-bold text-muted-foreground w-4">{i+1}</span>
                <span className="text-xs font-bold flex-1">{sym}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{Math.floor(Math.random()*20 + 5)} trades</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "MarketNotes":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-3">Market Notes</h3>
          <div className="flex-1 rounded-xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-100 dark:border-white/5 p-4 text-xs text-muted-foreground">
            <p className="italic">Click to add your market observations, key levels, or daily trading plan...</p>
          </div>
        </div>
      );
    case "RiskExposure":
      return (
        <div className="h-full w-full p-6 flex flex-col">
          <h3 className="text-sm font-bold mb-3">Risk Exposure</h3>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Daily Risk Limit</span>
              <span className="text-[11px] font-bold">$500</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-50 dark:bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: '35%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Max Position Size</span>
              <span className="text-[11px] font-bold">2%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-50 dark:bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
        </div>
      );

    default:
      return <div className="p-4 text-sm text-muted-foreground flex items-center justify-center w-full h-full">Unknown widget type</div>;
  }
}
