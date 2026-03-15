import { useState, useEffect } from "react";
import { useGetTrades } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/formatters";
import {
  ChevronLeft, ChevronRight, Sun, Moon, Brain, Target,
  CheckCircle2, Circle, Smile, Meh, Frown, Zap, AlertTriangle,
  TrendingUp, BookOpen, Plus, Save, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const MOODS = [
  { label: "Focused", icon: Zap, color: "text-primary bg-primary/10 border-primary/30" },
  { label: "Confident", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { label: "Neutral", icon: Meh, color: "text-muted-foreground bg-muted/30 border-border" },
  { label: "Anxious", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { label: "Fearful", icon: Frown, color: "text-red-500 bg-red-500/10 border-red-500/30" },
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
    toast({ title: "Journal saved", description: `Entry for ${formatDay(currentDate)} saved.` });
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
    toast({ title: "Entry cleared" });
  }

  function prevDay() { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }
  function nextDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date()) setCurrentDate(d);
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
  const isFuture = currentDate > new Date();

  if (!entry) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Daily Journal</h1>
          <p className="text-sm text-muted-foreground">Pre-market prep, trade notes & post-market review.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevDay}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="bg-card border border-border rounded-lg px-4 py-1.5 text-sm font-medium min-w-[140px] text-center">
            {isToday ? "Today — " : ""}{formatDay(currentDate)}
          </div>
          <Button variant="ghost" size="icon" onClick={nextDay} disabled={isToday}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Day Stats (if trades exist) */}
      {dayTrades.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel rounded-xl p-4 border border-border/60 text-center">
            <p className="text-xs text-muted-foreground mb-1">Day P&L</p>
            <p className={`text-xl font-bold font-display ${dayPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatMoney(dayPnl)}</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border/60 text-center">
            <p className="text-xs text-muted-foreground mb-1">Trades</p>
            <p className="text-xl font-bold font-display">{dayTrades.length}</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border/60 text-center">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-xl font-bold font-display">{dayTrades.length > 0 ? Math.round((dayWins / dayTrades.length) * 100) : 0}%</p>
          </div>
        </div>
      )}

      {/* Mood */}
      <div className="glass-panel rounded-xl p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Mental State</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(({ label, icon: Icon, color }) => (
            <button key={label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${entry.mood === label ? color : "text-muted-foreground border-border hover:border-foreground/30"}`}
              onClick={() => setMood(label)}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Market */}
      <div className="glass-panel rounded-xl p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-sm">Pre-Market Preparation</h2>
        </div>
        <div className="space-y-4">
          {entry.preMarket.map((item: any, i: number) => (
            <div key={i}>
              <p className="text-xs text-muted-foreground mb-1.5">{item.prompt}</p>
              <Textarea
                className="bg-background/50 border-border resize-none text-sm"
                rows={2}
                placeholder="Write your thoughts..."
                value={item.answer}
                onChange={e => setPreAnswer(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Daily Goals */}
      <div className="glass-panel rounded-xl p-5 border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Today's Goals</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addGoal}>
            <Plus className="w-3 h-3" />Add
          </Button>
        </div>
        <div className="space-y-2">
          {entry.goals.map((goal: any, i: number) => (
            <div key={i} className="flex items-center gap-2 group">
              <button onClick={() => toggleGoal(i)} className="shrink-0">
                {goal.done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Circle className="w-4 h-4 text-muted-foreground" />}
              </button>
              <input
                className={`flex-1 bg-transparent text-sm border-b border-transparent focus:border-border focus:outline-none py-0.5 transition-colors ${goal.done ? "line-through text-muted-foreground" : ""}`}
                placeholder="Set a goal for today..."
                value={goal.text}
                onChange={e => setGoalText(i, e.target.value)}
              />
              <button onClick={() => removeGoal(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Day's Trades */}
      {dayTrades.length > 0 && (
        <div className="glass-panel rounded-xl p-5 border border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Today's Trades</h2>
            <Badge variant="secondary" className="text-xs">{dayTrades.length}</Badge>
          </div>
          <div className="space-y-2">
            {dayTrades.map((t: any) => {
              const pnl = parseFloat(t.netPnl);
              return (
                <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold uppercase">{t.symbol}</span>
                    <Badge variant="outline" className="text-[10px] h-4">{t.direction}</Badge>
                    <span className="text-muted-foreground text-xs">{t.setupTag || "—"}</span>
                  </div>
                  <span className={`font-mono font-medium ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {pnl >= 0 ? "+" : ""}{formatMoney(pnl)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-Market */}
      <div className="glass-panel rounded-xl p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-sm">Post-Market Review</h2>
        </div>
        <div className="space-y-4">
          {entry.postMarket.map((item: any, i: number) => (
            <div key={i}>
              <p className="text-xs text-muted-foreground mb-1.5">{item.prompt}</p>
              <Textarea
                className="bg-background/50 border-border resize-none text-sm"
                rows={2}
                placeholder="Write your reflection..."
                value={item.answer}
                onChange={e => setPostAnswer(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Free Notes */}
      <div className="glass-panel rounded-xl p-5 border border-border/60">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Additional Notes</h2>
        </div>
        <Textarea
          className="bg-background/50 border-border resize-none text-sm"
          rows={5}
          placeholder="Any other thoughts, screenshots to annotate later, or trade ideas..."
          value={entry.freeNotes}
          onChange={e => setEntry((ev: any) => ({ ...ev, freeNotes: e.target.value }))}
        />
      </div>

      {/* Save / Delete */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={handleDelete}>
          <Trash2 className="w-3.5 h-3.5" />Clear entry
        </Button>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
          <Save className="w-4 h-4" />Save Journal
        </Button>
      </div>
    </div>
  );
}

function formatDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
