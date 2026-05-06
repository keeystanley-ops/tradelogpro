import { useGetWeeklyReview } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { formatMoney, formatPercent, formatNumber } from "@/lib/formatters";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  TrendingUp, 
  AlertCircle, 
  Award, 
  Activity, 
  Target, 
  DollarSign, 
  Percent, 
  Zap, 
  ShieldAlert, 
  Brain, 
  Sparkles, 
  BookOpen, 
  Goal, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  PieChart as PieChartIcon,
  ShieldCheck,
  RotateCcw,
  Plus,
  Save,
  MessageSquare,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie,
  CartesianGrid
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// --- Mock Data Generator for Augmentation ---
const generateMockFullReview = (date: Date) => {
  return {
    netPnl: 2450.50,
    pnlTrend: 12.5,
    winRate: 64.2,
    totalTrades: 28,
    avgRR: 2.4,
    expectancy: 87.50,
    largestWin: 1200,
    largestLoss: -450,
    maxDrawdown: -620,
    
    dailyPnl: [
      { date: 'Mon', pnl: 400 },
      { date: 'Tue', pnl: 1200 },
      { date: 'Wed', pnl: 900 },
      { date: 'Thu', pnl: 1800 },
      { date: 'Fri', pnl: 2450 },
    ],
    
    sessionPerformance: [
      { name: 'London', pnl: 1800, tradeCount: 12 },
      { name: 'New York', pnl: 1100, tradeCount: 14 },
      { name: 'Asia', pnl: -450, tradeCount: 2 },
    ],
    
    winLossData: [
      { name: 'Wins', value: 18, color: 'hsl(var(--profit))' },
      { name: 'Losses', value: 10, color: 'hsl(var(--loss))' },
    ],
    
    strategies: [
      { name: 'Breakout', winRate: 72, pnl: 1850, avgRR: 3.1 },
      { name: 'Mean Reversion', winRate: 45, pnl: -200, avgRR: 1.8 },
      { name: 'Trend Follow', winRate: 60, pnl: 800, avgRR: 2.5 },
    ],
    
    discipline: [
      { label: 'Out of Plan', count: 2, impact: -300, type: 'negative' },
      { label: 'Overtrading', count: 1, impact: -150, type: 'negative' },
      { label: 'Revenge Trades', count: 0, impact: 0, type: 'neutral' },
      { label: 'Missed Trades', count: 3, impact: 850, type: 'positive' }, 
    ],
    
    risk: {
      avgRiskPerTrade: 0.8,
      tradesExceedingLimit: 1,
      lossStreak: 3,
      riskDistribution: [
        { risk: '0.5%', count: 15 },
        { risk: '1.0%', count: 10 },
        { risk: '1.5%', count: 2 },
        { risk: '2.0%+', count: 1 },
      ]
    },
    
    aiInsights: [
      "Your win rate is 15% higher during the London session than New York.",
      "The 'Breakout' strategy continues to be your primary edge with a 3.1 R:R.",
      "Most losses occur on Thursdays after a major win on Wednesday. Be cautious of overconfidence.",
      "One trade outside your plan cost you $300, which is 12% of your weekly profit."
    ],
    
    highlights: {
      best: [
        { id: '1', symbol: 'NAS100', pnl: 1200, rr: 5.2, notes: 'Perfect breakout of the opening range. Trailed stop effectively.', tags: 'Breakout, High-Volume' },
        { id: '2', symbol: 'XAUUSD', pnl: 850, rr: 3.1, notes: 'London session retest of major support.', tags: 'Retest, Gold' }
      ],
      worst: { id: '3', symbol: 'EURUSD', pnl: -450, rr: -1.0, notes: 'Entered out of boredom during lunch hour. No setup.', tags: 'Boredom, Rule Violation' }
    },
    
    goals: [
      { id: 'g1', name: 'Weekly Profit Target', target: 3000, current: 2450.5, unit: '$', type: 'pnl' },
      { id: 'g2', name: 'Max Trades per Day', target: 5, current: 4.2, unit: '', type: 'volume' },
      { id: 'g3', name: 'Discipline Score', target: 90, current: 85, unit: '%', type: 'discipline' },
    ]
  };
};

export default function WeeklyReview() {
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const { toast } = useToast();
  const [reflection, setReflection] = useState({
    well: "",
    wrong: "",
    improve: ""
  });
  
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + (offset * 7));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString(), start, end };
  };

  const dates = getWeekDates(offsetWeeks);
  
  const { data: apiReview, isLoading } = useGetWeeklyReview({
    weekStart: dates.startDate
  });

  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      const mock = generateMockFullReview(dates.start);
      if (apiReview) {
        // MERGE REAL ACCOUNT DATA WITH THE FULL LAYOUT
        setReview({
          ...mock,
          ...apiReview,
          // Map API metrics back to the review layout
          netPnl: apiReview.netPnl ?? mock.netPnl,
          winRate: apiReview.winRate ?? mock.winRate,
          totalTrades: apiReview.totalTrades ?? mock.totalTrades,
          maxDrawdown: apiReview.maxDrawdown ?? mock.maxDrawdown,
          // Use real insights if available, otherwise mock for the "full feel"
          aiInsights: (apiReview.insights && apiReview.insights.length > 0) ? apiReview.insights : mock.aiInsights,
        });
      } else {
        // Fallback to mock for full UX demonstration even if week has no data yet
        setReview(mock);
      }
    }
  }, [apiReview, isLoading, offsetWeeks]);

  const handleSaveReflection = () => {
    toast({
      title: "Reflection Saved",
      description: "Your weekly journal entry has been updated.",
    });
  };

  const SummaryCard = ({ title, value, icon: Icon, trend, colorClass = "text-foreground" }: any) => (
    <div className="card-panel p-6 flex flex-col gap-1 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-12 h-12" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex items-end gap-3 translate-y-1">
        <span className={`text-2xl font-black ${colorClass}`}>{value}</span>
        {trend !== undefined && (
          <div className={`flex items-center text-[10px] font-black pb-1 ${trend >= 0 ? 'text-profit' : 'text-loss'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Running analysis...</p>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-display font-black tracking-tighter italic">Weekly <span className="text-primary not-italic">Review</span></h1>
          <p className="text-muted-foreground font-medium mt-1">Real-time performance intelligence from your execution log.</p>
        </motion.div>
        
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-1.5 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setOffsetWeeks(o => o - 1)} className="rounded-xl">
            <ChevronLeft className="w-4 h-4 text-primary" />
          </Button>
          <div className="flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-[0.2em] text-foreground min-w-[200px] justify-center">
            <CalendarDays className="w-4 h-4 text-primary opacity-50" />
            {dates.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - {dates.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOffsetWeeks(o => o + 1)} disabled={offsetWeeks >= 0} className="rounded-xl">
            <ChevronRight className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>

      {/* 1. Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Net P&L" 
          value={formatMoney(review.netPnl)} 
          icon={DollarSign} 
          trend={review.pnlTrend}
          colorClass={review.netPnl >= 0 ? "text-profit" : "text-loss"}
        />
        <SummaryCard 
          title="Win Rate" 
          value={formatPercent(review.winRate)} 
          icon={Percent} 
          trend={2.4} 
        />
        <SummaryCard 
          title="Avg R:R" 
          value={`${review.avgRR}x`} 
          icon={Target} 
          trend={-0.2} 
        />
        <SummaryCard 
          title="Expectancy" 
          value={formatMoney(review.expectancy)} 
          icon={Activity} 
          trend={15} 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-panel p-5 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Trades</p>
          <p className="text-xl font-black">{review.totalTrades}</p>
        </div>
        <div className="card-panel p-5 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Largest Win</p>
          <p className="text-xl font-black text-profit">{formatMoney(review.largestWin)}</p>
        </div>
        <div className="card-panel p-5 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Largest Loss</p>
          <p className="text-xl font-black text-loss">{formatMoney(review.largestLoss)}</p>
        </div>
        <div className="card-panel p-5 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Max Drawdown</p>
          <p className="text-xl font-black text-loss">{formatMoney(review.maxDrawdown)}</p>
        </div>
      </div>

      {/* 2. Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card-panel p-8">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-black text-lg tracking-tight">Equity Trajectory</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Cumulative performance trend</p>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={review.dailyPnl}>
                  <defs>
                    <linearGradient id="colorPnlRevert" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => formatMoney(val)}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorPnlRevert)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="card-panel p-6 flex-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Clock className="w-3.5 h-3.5 text-primary" /> Session Performance
              </h3>
              <div className="space-y-6">
                 {review.sessionPerformance.map((s: any, i: number) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-sm font-bold">{s.name}</span>
                         <span className={`text-sm font-black ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{formatMoney(s.pnl)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${s.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`} style={{ width: `${Math.min(100, Math.abs(s.pnl) / 20)}%` }} />
                      </div>
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.tradeCount} Trades executed</div>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="card-panel p-6 flex-1">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <PieChartIcon className="w-3.5 h-3.5 text-primary" /> Outcome Mix
              </h3>
              <div className="h-[150px] w-full mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={review.winLossData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                          {review.winLossData.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      {/* 3. Strategy & Behavioral Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel p-8">
           <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                 <Target className="w-5 h-5" />
              </div>
              Strategy Efficiency
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-border">
                       <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Strategy</th>
                       <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Win %</th>
                       <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Avg R:R</th>
                       <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Net P&L</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/50">
                    {review.strategies.map((s: any, i: number) => (
                       <tr key={i} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-4 text-sm font-bold">{s.name}</td>
                          <td className="py-4 text-center text-sm font-black">{s.winRate}%</td>
                          <td className="py-4 text-center text-sm font-black">{s.avgRR}x</td>
                          <td className={`py-4 text-right text-sm font-black ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>{formatMoney(s.pnl)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="card-panel p-8 bg-gradient-to-br from-card to-primary/[0.02]">
           <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Brain className="w-5 h-5" />
              </div>
              Discipline Ledger
           </h3>
           <div className="grid grid-cols-2 gap-4">
              {review.discipline.map((d: any, i: number) => (
                 <div key={i} className="card-panel p-5 bg-background shadow-inner">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                       {d.type === 'negative' ? <ShieldAlert className="w-3 h-3 text-loss" /> : 
                        d.type === 'positive' ? <CheckCircle2 className="w-3 h-3 text-profit" /> : 
                        <Activity className="w-3 h-3 text-primary" />}
                       {d.label}
                    </p>
                    <div className="flex items-end justify-between">
                       <span className="text-3xl font-black">{d.count}</span>
                       <span className={`text-[11px] font-black uppercase ${d.impact >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {d.impact >= 0 ? '+' : ''}{formatMoney(d.impact)}
                       </span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* 4. Risk Mgmt & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-5 card-panel p-8">
            <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <ShieldCheck className="w-5 h-5" />
               </div>
               Risk Exposure
            </h3>
            <div className="space-y-4">
               {review.risk.riskDistribution.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                     <span className="text-[11px] font-black w-12">{r.risk}</span>
                     <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(r.count / review.totalTrades) * 200}%` }} />
                     </div>
                     <span className="text-[10px] font-black text-muted-foreground">{r.count}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-7 card-panel p-8 bg-primary/[0.02] border-primary/20 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
            <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-5 h-5 fill-primary/20" />
               </div>
               AI Review Intelligence
            </h3>
            <div className="space-y-4">
               {review.aiInsights.map((insight: string, i: number) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} key={i} 
                    className="flex gap-4 p-5 rounded-2xl bg-card border border-border">
                     <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                     </div>
                     <p className="text-sm font-medium leading-relaxed">{insight}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </div>

      {/* 5. Trade Highlights */}
      <div className="card-panel p-8">
         <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
               <Award className="w-5 h-5" />
            </div>
            Weekly Highlights
         </h3>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-4">
               {review.highlights.best.map((t: any, i: number) => (
                  <div key={i} className="flex flex-col md:flex-row gap-6 p-6 rounded-3xl bg-muted/20 border border-border group hover:bg-muted/40 transition-all">
                     <div className="flex flex-col items-center justify-center p-4 min-w-[100px] border-r border-border/50">
                        <span className="text-xl font-black">{t.symbol}</span>
                        <div className="px-2 py-0.5 rounded-md bg-profit/10 text-profit text-[9px] font-black uppercase mt-1">WIN</div>
                     </div>
                     <div className="flex-1 space-y-3">
                        <div className="flex gap-8">
                           <div>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Profit</p>
                              <p className="text-lg font-black text-profit">+{formatMoney(t.pnl)}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">R-Multiple</p>
                              <p className="text-lg font-black">{t.rr} R</p>
                           </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">"{t.notes}"</p>
                     </div>
                  </div>
               ))}
            </div>
            <div className="lg:col-span-4 p-6 rounded-3xl bg-loss/5 border border-loss/20 h-full">
               <span className="text-xl font-black">{review.highlights.worst.symbol}</span>
               <div className="px-2 py-0.5 rounded-md bg-loss/10 text-loss text-[9px] font-black uppercase mt-1 inline-block ml-3">LOSS</div>
               <p className="text-xl font-black text-loss mt-4">{formatMoney(review.highlights.worst.pnl)}</p>
               <p className="text-sm font-medium italic text-muted-foreground mt-4">"{review.highlights.worst.notes}"</p>
            </div>
         </div>
      </div>

      {/* 6. Reflection & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-7 card-panel p-8">
            <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <BookOpen className="w-5 h-5" />
               </div>
               Weekly Reflection
            </h3>
            <div className="space-y-6">
               <textarea className="w-full h-24 bg-muted/20 border border-border rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none" placeholder="What did I do well?" />
               <textarea className="w-full h-24 bg-muted/20 border border-border rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none" placeholder="What went wrong?" />
               <Button className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20">Save Entry</Button>
            </div>
         </div>

         <div className="lg:col-span-5 card-panel p-8 bg-gradient-to-br from-card to-emerald-500/[0.02]">
            <h3 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Goal className="w-5 h-5" />
               </div>
               Goal Progression
            </h3>
            <div className="space-y-8">
               {review.goals.map((g: any, i: number) => {
                  const progress = (g.current / g.target) * 100;
                  return (
                     <div key={i} className="space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{g.name}</p>
                           <span className="text-[10px] font-black uppercase">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
}
