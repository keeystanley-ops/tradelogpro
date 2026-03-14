import { useGetWeeklyReview } from "@workspace/api-client-react";
import { useState } from "react";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, AlertCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function WeeklyReview() {
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  
  // Calculate start/end dates for the requested week
  const getWeekDates = (offset: number) => {
    const today = new Date();
    // Go to nearest past Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + (offset * 7));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { startDate: start.toISOString(), endDate: end.toISOString(), start, end };
  };

  const dates = getWeekDates(offsetWeeks);
  
  const { data: review, isLoading } = useGetWeeklyReview({
    startDate: dates.startDate,
    endDate: dates.endDate
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Weekly Review</h1>
          <p className="text-muted-foreground mt-1">Analyze your performance and habits week by week.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={() => setOffsetWeeks(o => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-2 text-sm font-medium min-w-[160px] justify-center">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {dates.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - {dates.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOffsetWeeks(o => o + 1)} disabled={offsetWeeks >= 0}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : !review || !review.metrics ? (
        <div className="text-center py-20 text-muted-foreground">No data available for this week.</div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl text-center">
              <p className="text-sm text-muted-foreground mb-1">Net P&L</p>
              <p className={`text-2xl font-display font-bold ${review.metrics.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatMoney(review.metrics.netPnl)}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center">
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-display font-bold text-white">
                {formatPercent(review.metrics.winRate)}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
              <p className="text-2xl font-display font-bold text-white">
                {review.metrics.tradeCount}
              </p>
            </div>
            <div className="glass-panel p-5 rounded-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl rounded-full" />
              <p className="text-sm text-muted-foreground mb-1">Consistency Score</p>
              <p className="text-2xl font-display font-bold text-primary">
                {Math.round(review.consistencyScore)}/100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
              <h3 className="font-display font-semibold mb-6 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" /> Daily P&L Curve
              </h3>
              <div className="h-[250px] w-full">
                {review.dailyPnl.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={review.dailyPnl}>
                      <defs>
                        <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        formatter={(val: number) => formatMoney(val)}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="hsl(var(--primary))" 
                        fill="url(#colorDaily)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
                    Not enough data
                  </div>
                )}
              </div>
            </div>

            {/* Best/Worst Trades */}
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-profit/5 to-transparent border-t border-t-profit/20">
                <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-profit" /> Best Trade
                </h4>
                {review.bestTrade ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display font-bold text-lg">{review.bestTrade.symbol}</span>
                      <Badge className="bg-profit/20 text-profit hover:bg-profit/20 border-0">{review.bestTrade.direction}</Badge>
                    </div>
                    <p className="text-2xl font-mono text-profit font-semibold">{formatMoney(review.bestTrade.netPnl)}</p>
                  </div>
                ) : <p className="text-muted-foreground text-sm">No profitable trades</p>}
              </div>

              <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-loss/5 to-transparent border-t border-t-loss/20">
                <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-loss" /> Worst Trade
                </h4>
                {review.worstTrade ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-display font-bold text-lg">{review.worstTrade.symbol}</span>
                      <Badge className="bg-loss/20 text-loss hover:bg-loss/20 border-0">{review.worstTrade.direction}</Badge>
                    </div>
                    <p className="text-2xl font-mono text-loss font-semibold">{formatMoney(review.worstTrade.netPnl)}</p>
                  </div>
                ) : <p className="text-muted-foreground text-sm">No losing trades</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Insights */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-display font-semibold mb-4 text-lg">This Week's Insights</h3>
              {review.insights.length > 0 ? (
                <ul className="space-y-3">
                  {review.insights.map((insight: any, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{insight.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">Not enough data to generate specific insights for this week.</p>
              )}
            </div>

            {/* Tags Summary */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-display font-semibold mb-4 text-lg">Top Behaviors</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Most Profitable Setup</p>
                  {review.topSetup ? (
                    <Badge variant="outline" className="text-sm py-1 border-primary/30 text-primary bg-primary/5">
                      {review.topSetup}
                    </Badge>
                  ) : <span className="text-sm text-muted-foreground">-</span>}
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Most Costly Mistake</p>
                  {review.topMistake ? (
                    <Badge variant="outline" className="text-sm py-1 border-loss/30 text-loss bg-loss/5">
                      {review.topMistake}
                    </Badge>
                  ) : <span className="text-sm text-muted-foreground">-</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
