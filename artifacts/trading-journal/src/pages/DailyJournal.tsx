import { useState, useEffect } from "react";
import { useGetTrades } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/formatters";
import {
  ChevronLeft, ChevronRight, Sun, Moon, Brain, Target,
  CheckCircle2, Circle, Smile, Meh, Frown, Zap, AlertTriangle,
  TrendingUp, BookOpen, Plus, Save, Trash2, Sparkles, Trophy,
  PenTool, Monitor, ListTodo, MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { label: "Focused", icon: Zap, color: "text-primary bg-primary/10 border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.1)]" },
  { label: "Confident", icon: Trophy, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" },
  { label: "Neutral", icon: Meh, color: "text-muted-foreground bg-muted/20 border-border" },
  { label: "Anxious", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" },
  { label: "Fearful", icon: Frown, color: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" },
];

const PRE_MARKET_PROMPTS = [
  "What is the overall market sentiment today?",
  "Key economic events or news to watch?",
  "What is my primary trading plan?",
  "What symbols am I watching?",
  "What are my max loss limits for today?",
];

const POST_MARKET_PROMPTS = [
  "Did I follow my trading plan?",
  "What was my biggest win and why?",
  "What was my biggest mistake?",
  "How was my emotional discipline?",
  "What will I do differently tomorrow?",
];

function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function loadEntry(key: string) {
  try {
    const raw = localStorage.getItem(`journal:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveEntry(key: string, data: any) {
  localStorage.setItem(`journal:${key}`, JSON.stringify(data));
}

function deleteEntry(key: string) {
  localStorage.removeItem(`journal:${key}`);
}

export default function DailyJournal() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const dayKey = getDayKey(currentDate);
  const start = new Date(currentDate); start.setHours(0, 0, 0, 0);
  const end = new Date(currentDate); end.setHours(23, 59, 59, 999);

  const { data: tradesData } = useGetTrades({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    limit: 50,
  });

  const [entry, setEntry] = useState<any>(null);

  useEffect(() => {
    const saved = loadEntry(dayKey);
    if (saved) {
      setEntry(saved);
    } else {
      setEntry({
        mood: "",
        preMarket: PRE_MARKET_PROMPTS.map(p => ({ prompt: p, answer: "" })),
        postMarket: POST_MARKET_PROMPTS.map(p => ({ prompt: p, answer: "" })),
        goals: [{ text: "", done: false }],
        freeNotes: "",
      });
    }
  }, [dayKey]);

  function handleSave() {
    saveEntry(dayKey, entry);
    toast({ title: "Journal preserved", description: `Entry for ${formatDay(currentDate)} successfully saved.` });
  }

  function handleDelete() {
    deleteEntry(dayKey);
    setEntry({
      mood: "",
      preMarket: PRE_MARKET_PROMPTS.map(p => ({ prompt: p, answer: "" })),
      postMarket: POST_MARKET_PROMPTS.map(p => ({ prompt: p, answer: "" })),
      goals: [{ text: "", done: false }],
      freeNotes: "",
    });
    toast({ title: "Entry purged", variant: "destructive" });
  }

  function prevDay() { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }
  function nextDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d <= today) setCurrentDate(d);
  }

  function setMood(mood: string) { setEntry((e: any) => ({ ...e, mood })); }
  function setPreAnswer(i: number, val: string) {
    setEntry((e: any) => { const a = [...e.preMarket]; a[i] = { ...a[i], answer: val }; return { ...e, preMarket: a }; });
  }
  function setPostAnswer(i: number, val: string) {
    setEntry((e: any) => { const a = [...e.postMarket]; a[i] = { ...a[i], answer: val }; return { ...e, postMarket: a }; });
  }
  function toggleGoal(i: number) {
    setEntry((e: any) => { const g = [...e.goals]; g[i] = { ...g[i], done: !g[i].done }; return { ...e, goals: g }; });
  }
  function setGoalText(i: number, val: string) {
    setEntry((e: any) => { const g = [...e.goals]; g[i] = { ...g[i], text: val }; return { ...e, goals: g }; });
  }
  function addGoal() {
    setEntry((e: any) => ({ ...e, goals: [...e.goals, { text: "", done: false }] }));
  }
  function removeGoal(i: number) {
    setEntry((e: any) => ({ ...e, goals: e.goals.filter((_: any, idx: number) => idx !== i) }));
  }

  const dayTrades = tradesData?.trades ?? [];
  const dayPnl = dayTrades.reduce((s: number, t: any) => s + parseFloat(t.netPnl || 0), 0);
  const dayWins = dayTrades.filter((t: any) => parseFloat(t.netPnl) > 0).length;
  const isToday = getDayKey(currentDate) === getDayKey(new Date());

  if (!entry) return (
     <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin dark:shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Opening Ledger...</p>
     </div>
  );

  return (
    <div className="space-y-10 pb-12 max-w-4xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
              <PenTool className="w-3 h-3" /> Trading Journal
           </div>
          <h1 className="text-4xl font-display font-black tracking-tight">Daily Record</h1>
          <p className="text-sm text-muted-foreground mt-1">Mental preparation and execution audit.</p>
        </div>
        
        <div className="flex items-center gap-3 p-1 bg-muted/20 border border-border rounded-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl hover:bg-muted/40" 
            onClick={prevDay}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              {isToday ? "Today's Entry" : "Historical View"}
            </p>
            <p className="text-xs font-bold whitespace-nowrap min-w-[120px]">
              {formatDay(currentDate)}
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl hover:bg-muted/40" 
            onClick={nextDay} 
            disabled={isToday}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Snapshot Stats */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={dayKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="card-panel relative overflow-hidden group">
            <div className={cn("absolute top-0 left-0 w-full h-0.5", dayPnl >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
            <div className="p-5 text-center">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Session P&L</p>
              <p className={cn(
                "text-2xl font-display font-black",
                dayPnl >= 0 ? "text-emerald-500 stat-glow-profit" : "text-rose-500 stat-glow-loss"
              )}>
                {formatMoney(dayPnl)}
              </p>
            </div>
          </div>
          <div className="card-panel relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
            <div className="p-5 text-center">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Execution Vol</p>
              <p className="text-2xl font-display font-black text-foreground">
                {dayTrades.length} <span className="text-[10px] font-bold text-muted-foreground uppercase">Deals</span>
              </p>
            </div>
          </div>
          <div className="card-panel relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-violet-600" />
            <div className="p-5 text-center">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">Strike Rate</p>
              <p className="text-2xl font-display font-black text-foreground">
                {dayTrades.length > 0 ? Math.round((dayWins / dayTrades.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-8">
        {/* Mood Selector Section */}
        <div className="card-panel p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <Brain className="w-24 h-24 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
               <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Psychological State</h2>
               <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">How is your mental clarity today?</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {MOODS.map(({ label, icon: Icon, color }) => (
              <button key={label}
                className={cn(
                   "group relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border transition-all duration-300",
                   entry.mood === label 
                    ? color 
                    : "bg-muted/10 border-border text-muted-foreground hover:border-primary/20 hover:bg-muted/20"
                )}
                onClick={() => setMood(label)}>
                <Icon className={cn("w-6 h-6 mb-1 transition-transform group-hover:scale-110", entry.mood === label ? "animate-pulse" : "opacity-40")} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preparation & Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pre-Market Section */}
          <div className="card-panel p-6 border-l-4 border-l-amber-500/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Pre-Market Prep</h2>
            </div>
            <div className="space-y-6">
              {entry.preMarket.map((item: any, i: number) => (
                <div key={i} className="group">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em] mb-2 group-focus-within:text-amber-500 transition-colors">
                     {item.prompt}
                  </p>
                  <Textarea
                    className="bg-muted/10 border-border focus:border-amber-500/50 focus:ring-amber-500/10 rounded-xl resize-none text-[13px] font-medium leading-relaxed"
                    rows={2}
                    placeholder="Capture your pre-session thesis..."
                    value={item.answer}
                    onChange={e => setPreAnswer(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Goals Section */}
          <div className="card-panel p-6 border-l-4 border-l-primary/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ListTodo className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Daily Objectives</h2>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-lg border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 font-black text-[10px] uppercase tracking-widest" onClick={addGoal}>
                <Plus className="w-3 h-3 mr-1.5" />New Task
              </Button>
            </div>
            <div className="space-y-3">
              {entry.goals.map((goal: any, i: number) => (
                <div key={i} className="flex items-center gap-4 group bg-muted/10 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                  <button onClick={() => toggleGoal(i)} className="shrink-0 transition-transform active:scale-95">
                    {goal.done
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      : <Circle className="w-6 h-6 text-muted-foreground/30 hover:text-primary transition-colors" />}
                  </button>
                  <div className="flex-1">
                    <input
                      className={cn(
                        "w-full bg-transparent text-sm font-bold focus:outline-none transition-all",
                        goal.done ? "line-through text-muted-foreground/40" : "text-foreground"
                      )}
                      placeholder="Define a specific goal..."
                      value={goal.text}
                      onChange={e => setGoalText(i, e.target.value)}
                    />
                  </div>
                  <button onClick={() => removeGoal(i)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg group/del">
                    <Trash2 className="w-4 h-4 text-muted-foreground/40 group-hover/del:text-destructive transition-colors" />
                  </button>
                </div>
              ))}
              {entry.goals.length === 0 && (
                 <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-border rounded-3xl">
                    <ListTodo className="w-8 h-8 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">No goals defined</p>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade Review Section */}
        {dayTrades.length > 0 && (
          <div className="card-panel p-6 border-l-4 border-l-violet-500/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Monitor className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Session Log</h2>
              <Badge className="bg-violet-500/10 text-violet-500 border-none px-2 rounded-lg font-black text-[10px]">
                {dayTrades.length} EXECUTIONS
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayTrades.map((t: any) => {
                const pnl = parseFloat(t.netPnl);
                return (
                  <div key={t.id} className="p-4 bg-muted/10 rounded-2xl border border-border group hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black tracking-tight uppercase group-hover:text-primary transition-colors">{t.symbol}</span>
                      <span className={cn(
                        "text-[10px] font-black font-mono",
                        pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {pnl >= 0 ? "+" : ""}{formatMoney(pnl)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 rounded-lg border-border/60">{t.direction}</Badge>
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">{t.setupTag || "NO TAG"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-Market & Notes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Post-Market Section */}
          <div className="card-panel p-6 border-l-4 border-l-indigo-600/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                <Moon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Post-Market Review</h2>
            </div>
            <div className="space-y-6">
              {entry.postMarket.map((item: any, i: number) => (
                <div key={i} className="group">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em] mb-2 group-focus-within:text-indigo-600 transition-colors">
                     {item.prompt}
                  </p>
                  <Textarea
                    className="bg-muted/10 border-border focus:border-indigo-600/50 focus:ring-indigo-600/10 rounded-xl resize-none text-[13px] font-medium leading-relaxed"
                    rows={2}
                    placeholder="Analyze your discipline..."
                    value={item.answer}
                    onChange={e => setPostAnswer(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="card-panel p-6 relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Daily Synthesis</h2>
            </div>
            <div className="space-y-4 h-full flex flex-col">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em]">Free-form Analysis</p>
              <Textarea
                className="flex-1 bg-muted/10 border-border focus:border-primary/50 focus:ring-primary/10 rounded-2xl resize-none text-[13px] font-medium leading-relaxed min-h-[300px]"
                placeholder="Market observations, key lessons, chart annotations or screenshots to remember..."
                value={entry.freeNotes}
                onChange={e => setEntry((ev: any) => ({ ...ev, freeNotes: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Action Bar */}
      <div className="sticky bottom-8 left-0 right-0 z-50 px-4 pointer-events-none">
         <div className="max-w-md mx-auto pointer-events-auto">
            <div className="bg-card/80 backdrop-blur-2xl border border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-4 flex items-center justify-between gap-4">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" 
                   onClick={handleDelete}
                   title="Clear Current Record"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
                
                <Button 
                   className={cn(
                      "flex-1 h-12 rounded-2xl gap-3 font-black text-xs uppercase tracking-widest transition-all",
                      "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700",
                      "hover:from-violet-500 hover:via-purple-500 hover:to-violet-600",
                      "shadow-xl shadow-purple-500/25 active:scale-[0.98] text-white border-none"
                   )} 
                   onClick={handleSave}
                >
                  <Save className="w-4 h-4" />
                  Preserve Entry
                </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

function formatDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
