import { useGetHeatmap, useGetSymbolPerformance, useGetBehavioralAnalytics } from "@workspace/api-client-react";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useGetHeatmap();
  const { data: symbolData, isLoading: isLoadingSymbols } = useGetSymbolPerformance();
  const { data: behavioralData, isLoading: isLoadingBehavioral } = useGetBehavioralAnalytics();

  if (isLoadingHeatmap || isLoadingSymbols || isLoadingBehavioral) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Colors for charts
  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--loss))', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Deep Analytics</h1>
        <p className="text-muted-foreground mt-1 text-lg">Uncover patterns in your trading behavior.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Heatmap */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-6">Time & Day Profitability</h3>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex pl-10 mb-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                    {i + 6}h {/* Showing 6am to 8pm roughly */}
                  </div>
                ))}
              </div>
              
              {/* Grid rows */}
              <div className="space-y-1">
                {DAYS.map((dayName, dayIdx) => (
                  <div key={dayIdx} className="flex items-center">
                    <div className="w-10 text-xs font-medium text-muted-foreground">{dayName}</div>
                    <div className="flex-1 flex gap-1 h-8">
                      {Array.from({ length: 15 }).map((_, hourOffset) => {
                        const hour = hourOffset + 6;
                        // Find cell data if exists
                        const cell = heatmapData?.cells.find(c => c.dayOfWeek === dayIdx && c.hour === hour);
                        
                        let bgColor = 'bg-white/5';
                        if (cell) {
                          if (cell.pnl > 0) bgColor = `bg-profit/${Math.max(20, Math.min(100, Math.round((cell.pnl / 1000) * 100)))}`;
                          else if (cell.pnl < 0) bgColor = `bg-loss/${Math.max(20, Math.min(100, Math.round((Math.abs(cell.pnl) / 1000) * 100)))}`;
                        }

                        return (
                          <div 
                            key={hour} 
                            className={`flex-1 rounded-sm ${bgColor} hover:ring-2 ring-white/50 cursor-crosshair transition-all`}
                            title={cell ? `${dayName} ${hour}:00\nP&L: ${formatMoney(cell.pnl)}\nTrades: ${cell.tradeCount}` : 'No trades'}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Symbol Performance */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-6">Top Symbols by P&L</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolData?.topWinners.slice(0, 7) || []} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="symbol" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 600 }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [formatMoney(value), "Net P&L"]}
                />
                <Bar dataKey="netPnl" fill="hsl(var(--profit))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mistake Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-6">Mistakes Cost Analysis</h3>
          {behavioralData?.mistakeDistribution && behavioralData.mistakeDistribution.length > 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={behavioralData.mistakeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalLoss"
                    nameKey="tag"
                  >
                    {behavioralData.mistakeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatMoney(Math.abs(value))}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ paddingLeft: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
              Not enough mistake data tagged yet.
            </div>
          )}
        </div>

        {/* Setup Performance */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-display font-semibold mb-6">Setup Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Setup</th>
                  <th className="px-4 py-3 font-medium">Trades</th>
                  <th className="px-4 py-3 font-medium">Win Rate</th>
                  <th className="px-4 py-3 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {behavioralData?.setupPerformance.map((setup, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{setup.setup}</td>
                    <td className="px-4 py-3 text-muted-foreground">{setup.tradeCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-10">{formatPercent(setup.winRate)}</span>
                        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, setup.winRate)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${setup.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatMoney(setup.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
