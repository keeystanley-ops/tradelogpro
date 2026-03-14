import { useGetDashboardAnalytics, useGetEquityCurve, useGetTrades } from "@workspace/api-client-react";
import { formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Target, Zap, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ZellaScore from "@/components/ZellaScore";

export default function Dashboard() {
  const { data: metrics, isLoading: isMetricsLoading } = useGetDashboardAnalytics();
  const { data: equityData, isLoading: isEquityLoading } = useGetEquityCurve();
  const { data: recentTradesData } = useGetTrades({ limit: 5 });

  if (isMetricsLoading || isEquityLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!metrics || !equityData) return <div>Failed to load dashboard data.</div>;

  const isProfit = metrics.netPnl >= 0;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-lg">Your trading performance at a glance.</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full transition-opacity opacity-20 group-hover:opacity-40 ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            Net P&L {isProfit ? <ArrowUpRight className="w-4 h-4 text-profit" /> : <ArrowDownRight className="w-4 h-4 text-loss" />}
          </p>
          <h3 className={`text-4xl font-display font-bold tracking-tight data-value ${isProfit ? 'text-profit' : 'text-loss'}`}>
            {formatMoney(metrics.netPnl)}
          </h3>
          <p className="text-xs text-muted-foreground mt-4 font-mono border-t border-white/5 pt-3">
            Gross: {formatMoney(metrics.grossPnl)} | Comms: {formatMoney(metrics.totalCommissions)}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Win Rate
          </p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-display font-bold data-value text-white">
              {formatPercent(metrics.winRate)}
            </h3>
          </div>
          <div className="w-full bg-background rounded-full h-1.5 mt-5 overflow-hidden">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, metrics.winRate))}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">{metrics.winningTrades}W - {metrics.losingTrades}L</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-foreground" /> Profit Factor
          </p>
          <h3 className="text-4xl font-display font-bold data-value text-white">
            {formatNumber(metrics.profitFactor)}
          </h3>
          <p className="text-xs text-muted-foreground mt-4 font-mono border-t border-white/5 pt-3">
            Avg Win: <span className="text-profit">{formatMoney(metrics.avgWin)}</span> | Avg Loss: <span className="text-loss">{formatMoney(metrics.avgLoss)}</span>
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Expectancy
          </p>
          <h3 className={`text-4xl font-display font-bold data-value ${metrics.expectancy >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatMoney(metrics.expectancy)}
          </h3>
          <p className="text-xs text-muted-foreground mt-4 font-mono border-t border-white/5 pt-3">
            Per Trade Average
          </p>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="glass-panel rounded-2xl p-6 col-span-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-semibold">Equity Curve & Drawdown</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary"></div>
              Cumulative P&L
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-loss/20 border border-loss/50"></div>
              Drawdown
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData.points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--loss))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--loss))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                tickMargin={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(val) => `$${val}`}
                tickMargin={10}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--loss))" 
                fontSize={12}
                tickFormatter={(val) => `${val}%`}
                hide={true}
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                formatter={(value: any, name: string) => {
                  if (name === "cumulativePnl") return [formatMoney(value), "Cumulative P&L"];
                  if (name === "drawdownPct") return [`${value}%`, "Drawdown"];
                  return [value, name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
              
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="drawdownPct" 
                stroke="hsl(var(--loss))" 
                fillOpacity={1} 
                fill="url(#colorDd)" 
                strokeWidth={0}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="cumulativePnl" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorPnl)" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zella Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ZellaScore />
        </div>
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-background/50 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
              <p className="text-xl font-mono font-semibold text-loss">{formatMoney(metrics.maxDrawdown)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatPercent(metrics.maxDrawdownPct)} of peak</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
              <p className="text-xl font-mono font-semibold text-foreground">{formatNumber(metrics.sharpeRatio ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Annualized</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Avg Hold Time</p>
              <p className="text-xl font-mono font-semibold text-foreground">{Math.round(metrics.avgHoldingMinutes)} min</p>
              <p className="text-xs text-muted-foreground mt-0.5">Per trade avg</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
              <p className={`text-xl font-mono font-semibold ${metrics.currentStreakType === 'WIN' ? 'text-profit' : 'text-loss'}`}>
                {metrics.currentStreak} {metrics.currentStreakType}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Consecutive trades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Behavioral Summary */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h3 className="text-xl font-display font-semibold">Stats & Streaks</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertTriangle className="w-5 h-5 text-loss" /> Max Drawdown
              </div>
              <span className="font-mono font-medium text-loss">{formatMoney(metrics.maxDrawdown)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" /> Avg Hold Time
              </div>
              <span className="font-mono font-medium">{Math.round(metrics.avgHoldingMinutes)} min</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Zap className="w-5 h-5 text-yellow-500" /> Current Streak
              </div>
              <span className="font-mono font-medium flex items-center gap-2">
                {metrics.currentStreak} {metrics.currentStreakType}
                {metrics.currentStreakType === 'WIN' && <span className="w-2 h-2 rounded-full bg-profit"></span>}
                {metrics.currentStreakType === 'LOSS' && <span className="w-2 h-2 rounded-full bg-loss"></span>}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Trades Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-6">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTradesData?.trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 font-display font-semibold text-white uppercase">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <Badge className={trade.direction === 'LONG' ? 'bg-profit/10 text-profit border-0' : 'bg-loss/10 text-loss border-0'} variant="outline">
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(trade.exitTime).toLocaleDateString()}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${trade.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatMoney(trade.netPnl)}
                    </td>
                  </tr>
                ))}
                {!recentTradesData?.trades.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No recent trades found. Log a trade to see it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
