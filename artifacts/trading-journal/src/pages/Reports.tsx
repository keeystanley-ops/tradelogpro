import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { formatMoney, formatPercent, formatNumber } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { BarChart2, Clock, TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

const API = "/api";

function useReportBySymbol() {
  return useQuery({
    queryKey: ["report-by-symbol"],
    queryFn: () => fetch(`${API}/analytics/reports/by-symbol`).then(r => r.json()),
  });
}

function useReportBySetup() {
  return useQuery({
    queryKey: ["report-by-setup"],
    queryFn: () => fetch(`${API}/analytics/reports/by-setup`).then(r => r.json()),
  });
}

function useReportByTime() {
  return useQuery({
    queryKey: ["report-by-time"],
    queryFn: () => fetch(`${API}/analytics/reports/by-time`).then(r => r.json()),
  });
}

function useReportStreaks() {
  return useQuery({
    queryKey: ["report-streaks"],
    queryFn: () => fetch(`${API}/analytics/reports/streaks`).then(r => r.json()),
  });
}

const TABS = [
  { id: "symbol", label: "By Symbol", icon: BarChart2 },
  { id: "setup", label: "By Setup", icon: Target },
  { id: "time", label: "By Time", icon: Clock },
  { id: "streaks", label: "Streaks", icon: Zap },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("symbol");
  const { data: symbolData, isLoading: symbolLoading } = useReportBySymbol();
  const { data: setupData, isLoading: setupLoading } = useReportBySetup();
  const { data: timeData, isLoading: timeLoading } = useReportByTime();
  const { data: streaksData } = useReportStreaks();

  const PROFIT_COLOR = "#10b981";
  const LOSS_COLOR = "#ef4444";
  const PRIMARY_COLOR = "#6366f1";

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1 text-lg">Deep-dive analytics across symbols, setups, and time.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* By Symbol */}
      {activeTab === "symbol" && (
        <div className="space-y-6">
          {symbolLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">P&L by Symbol</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={symbolData?.data?.slice(0, 10)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number) => [formatMoney(v), "Net P&L"]}
                      />
                      <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                        {symbolData?.data?.slice(0, 10).map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.netPnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Symbol</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Trades</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Win Rate</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Profit Factor</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Net P&L</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {symbolData?.data?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-foreground">{row.symbol}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">{row.tradeCount}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={row.winRate >= 50 ? "text-emerald-500" : "text-red-500"}>
                            {formatPercent(row.winRate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          <span className={row.profitFactor >= 1 ? "text-emerald-500" : "text-red-500"}>
                            {row.profitFactor >= 999 ? "∞" : formatNumber(row.profitFactor)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-semibold ${row.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {formatMoney(row.netPnl)}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono ${row.avgPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {formatMoney(row.avgPnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* By Setup */}
      {activeTab === "setup" && (
        <div className="space-y-6">
          {setupLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">P&L by Setup</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setupData?.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="setup" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number) => [formatMoney(v), "Net P&L"]}
                      />
                      <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                        {setupData?.data?.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.netPnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Setup</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Trades</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Win Rate</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Net P&L</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {setupData?.data?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium">{row.setup}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">{row.tradeCount}</td>
                        <td className={`px-6 py-4 text-right font-mono ${row.winRate >= 50 ? "text-emerald-500" : "text-red-500"}`}>{formatPercent(row.winRate)}</td>
                        <td className={`px-6 py-4 text-right font-mono font-semibold ${row.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatMoney(row.netPnl)}</td>
                        <td className={`px-6 py-4 text-right font-mono ${row.avgPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatMoney(row.avgPnl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* By Time */}
      {activeTab === "time" && (
        <div className="space-y-6">
          {timeLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">P&L by Day of Week</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData?.byDayOfWeek} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number, name: string) => [name === "netPnl" ? formatMoney(v) : v, name === "netPnl" ? "Net P&L" : "Trades"]}
                      />
                      <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                        {timeData?.byDayOfWeek?.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.netPnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">P&L by Hour of Day</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData?.byHourOfDay?.filter((h: any) => h.tradeCount > 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}:00`} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number) => [formatMoney(v), "Net P&L"]}
                        labelFormatter={(v) => `${v}:00 UTC`}
                      />
                      <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                        {timeData?.byHourOfDay?.filter((h: any) => h.tradeCount > 0).map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.netPnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Streaks */}
      {activeTab === "streaks" && streaksData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <p className={`text-4xl font-bold font-mono ${streaksData.currentStreakType === "WIN" ? "text-emerald-500" : "text-red-500"}`}>
                {streaksData.currentStreak}
              </p>
              <p className={`text-sm font-medium mt-1 ${streaksData.currentStreakType === "WIN" ? "text-emerald-500" : "text-red-500"}`}>
                {streaksData.currentStreakType === "WIN" ? "🔥 Win Streak" : "💧 Loss Streak"}
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Best Win Streak</p>
              <p className="text-4xl font-bold font-mono text-emerald-500">{streaksData.longestWinStreak}</p>
              <p className="text-sm text-muted-foreground mt-1">Consecutive Wins</p>
            </div>
            <div className="glass-panel rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Worst Loss Streak</p>
              <p className="text-4xl font-bold font-mono text-red-500">{streaksData.longestLossStreak}</p>
              <p className="text-sm text-muted-foreground mt-1">Consecutive Losses</p>
            </div>
            <div className="glass-panel rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Streaks</p>
              <p className="text-4xl font-bold font-mono text-primary">{streaksData.streaks?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Streak Sequences</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Streak History</h3>
            <div className="flex flex-wrap gap-2">
              {streaksData.streaks?.map((s: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono border ${
                    s.type === "WIN"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-red-500/10 border-red-500/30 text-red-500"
                  }`}
                >
                  {s.type === "WIN" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {s.length}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
