import { useGetHeatmap, useGetSymbolPerformance, useGetBehavioralAnalytics } from "@workspace/api-client-react";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Brain, Calendar, Info, LineChart, PieChart as PieIcon, Sparkles } from "lucide-react";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const { data: heatmapData, isLoading: isLoadingHeatmap } = useGetHeatmap();
  const { data: symbolData, isLoading: isLoadingSymbols } = useGetSymbolPerformance();
  const { data: behavioralData, isLoading: isLoadingBehavioral } = useGetBehavioralAnalytics();

  if (isLoadingHeatmap || isLoadingSymbols || isLoadingBehavioral) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin dark:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Analyzing Pattern Data...</p>
      </div>
    );
  }

  // Colors for charts - vibrant Dribbble palette
  const PIE_COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--accent))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 
    'hsl(var(--chart-5))'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{label || payload[0].name}</p>
          <p className="text-sm font-bold text-foreground">
            {typeof payload[0].value === 'number' ? formatMoney(payload[0].value) : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
              <Brain className="w-3 h-3" /> Advanced Intelligence
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight flex items-center gap-4">
            Insights
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Deep dive into behavioral patterns and statistical edges based on your execution history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Heatmap Panel */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="card-panel relative overflow-hidden group"
        >
          {/* Subtle decoration */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 blur-[80px] pointer-events-none" />
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                Time & Day Profitability
               </h3>
               <Info className="w-4 h-4 text-muted-foreground/40 hover:text-primary transition-colors cursor-help" />
            </div>

            <div className="w-full overflow-x-auto no-scrollbar pb-4">
              <div className="min-w-[550px]">
                {/* Hour labels */}
                <div className="flex pl-12 mb-3">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex-1 text-[9px] font-black text-muted-foreground/40 text-center">
                      {i + 6}h
                    </div>
                  ))}
                </div>
                
                {/* Grid rows */}
                <div className="space-y-1.5">
                  {DAYS.map((dayName, dayIdx) => (
                    <div key={dayIdx} className="flex items-center">
                      <div className="w-12 text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider">{dayName}</div>
                      <div className="flex-1 flex gap-1.5 h-9">
                        {Array.from({ length: 15 }).map((_, hourOffset) => {
                          const hour = hourOffset + 6;
                          const cell = heatmapData?.cells.find(c => c.dayOfWeek === dayIdx && c.hour === hour);
                          
                          let style: React.CSSProperties = { background: 'hsl(var(--muted) / 0.15)' };
                          let intensity = 0;
                          
                          if (cell) {
                            if (cell.pnl > 0) {
                              intensity = Math.max(15, Math.min(90, Math.round((cell.pnl / 1000) * 100)));
                              style = { 
                                background: `hsl(var(--profit) / ${intensity/100})`,
                                border: `1px solid hsl(var(--profit) / 0.2)`
                              };
                            } else if (cell.pnl < 0) {
                              intensity = Math.max(15, Math.min(90, Math.round((Math.abs(cell.pnl) / 1000) * 100)));
                              style = { 
                                background: `hsl(var(--loss) / ${intensity/100})`,
                                border: `1px solid hsl(var(--loss) / 0.2)`
                              };
                            }
                          }

                          return (
                            <div 
                              key={hour} 
                              className="flex-1 rounded-md transition-all duration-300 hover:ring-2 hover:ring-primary/40 cursor-pointer relative group/cell"
                              style={style}
                            >
                               {cell && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-xl shadow-2xl text-[10px] whitespace-nowrap opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-xl">
                                     <p className="font-black text-primary mb-1 uppercase tracking-widest">{dayName} {hour}:00</p>
                                     <p className={cn("font-bold", cell.pnl >= 0 ? "text-profit" : "text-loss")}>
                                        {formatMoney(cell.pnl)}
                                     </p>
                                     <p className="text-muted-foreground/60 font-medium">{cell.tradeCount} Trades</p>
                                  </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded bg-loss/20" />
                     <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Loss Zone</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded bg-profit/20" />
                     <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Profit Zone</span>
                  </div>
               </div>
               <p className="text-[10px] font-medium text-muted-foreground/40 italic">* Values normalized to max sample range</p>
            </div>
          </div>
        </motion.div>

        {/* Symbol Performance */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="card-panel p-6 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <LineChart className="w-4 h-4 text-primary" />
              Leaderboard by Realized P&L
            </h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolData?.topWinners.slice(0, 7) || []} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <defs>
                   <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--profit))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--profit))" stopOpacity={1} />
                   </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis 
                   dataKey="symbol" 
                   type="category" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }} 
                   width={70} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={<CustomTooltip />}
                />
                <Bar 
                   dataKey="netPnl" 
                   fill="url(#barGrad)" 
                   radius={[0, 10, 10, 0]} 
                   barSize={32} 
                   animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Mistake Distribution */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="card-panel p-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <PieIcon className="w-4 h-4 text-primary" />
              Negative Edge Attribution
            </h3>
          </div>
          
          {behavioralData?.mistakeDistribution && behavioralData.mistakeDistribution.length > 0 ? (
            <div className="h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={behavioralData.mistakeDistribution}
                    cx="40%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="totalLoss"
                    nameKey="tag"
                    stroke="none"
                  >
                    {behavioralData.mistakeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Legend 
                     verticalAlign="middle" 
                     align="right" 
                     layout="vertical" 
                     wrapperStyle={{ paddingLeft: '40px' }}
                     formatter={(value) => <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-border/60 rounded-3xl bg-muted/5">
              <Brain className="w-10 h-10 mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest text-center max-w-[200px]">Insufficient mistake data for attribution</p>
            </div>
          )}
        </motion.div>

        {/* Setup Performance */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.3 }}
           className="card-panel overflow-hidden relative"
        >
          <div className="p-6 border-b border-border/40 bg-muted/10">
             <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-widest">
               Strategy Effectiveness Matrix
             </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] bg-muted/10">
                  <th className="px-6 py-4">Trading Setup</th>
                  <th className="px-6 py-4">Vol</th>
                  <th className="px-6 py-4">Win Efficiency</th>
                  <th className="px-6 py-4 text-right">Net Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {behavioralData?.setupPerformance.map((setup, idx) => (
                  <tr key={idx} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-4">
                       <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{setup.setup}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-bold font-mono text-muted-foreground/60">{setup.tradeCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold w-10">{formatPercent(setup.winRate)}</span>
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn(
                             "h-full rounded-full transition-all duration-1000",
                             setup.winRate >= 50 ? "bg-primary" : "bg-muted-foreground/40"
                          )} style={{ width: `${Math.min(100, setup.winRate)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className={cn(
                       "px-6 py-4 text-right font-display font-black text-xs",
                       setup.netPnl >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {formatMoney(setup.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
