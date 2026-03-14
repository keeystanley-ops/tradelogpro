import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Trophy, Target, Zap, TrendingUp, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const API = "/api";

interface Challenge {
  id: number;
  name: string;
  description: string;
  type: "CONSISTENCY" | "PROFITABILITY" | "DISCIPLINE";
  targetMetrics: Record<string, number>;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  progress: number;
  createdAt: string;
}

function useChallenges() {
  return useQuery<{ challenges: Challenge[] }>({
    queryKey: ["challenges"],
    queryFn: () => fetch(`${API}/challenges`).then(r => r.json()),
  });
}

const CHALLENGE_TYPES = [
  { value: "CONSISTENCY", label: "Consistency", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { value: "PROFITABILITY", label: "Profitability", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { value: "DISCIPLINE", label: "Discipline", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
];

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  FAILED: { label: "Failed", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

const PRESET_CHALLENGES = [
  {
    name: "5-Day Win Streak",
    description: "Win 5 consecutive trading days without a losing day.",
    type: "CONSISTENCY" as const,
    targetMetrics: { consecutiveWinDays: 5 },
  },
  {
    name: "Win Rate 70%+",
    description: "Achieve a 70% or higher win rate over 20 trades.",
    type: "PROFITABILITY" as const,
    targetMetrics: { winRate: 70, minTrades: 20 },
  },
  {
    name: "Journal Every Trade",
    description: "Add notes and tags to every trade for 30 days.",
    type: "DISCIPLINE" as const,
    targetMetrics: { journalCompleteness: 100 },
  },
  {
    name: "Profit Factor 2.0",
    description: "Maintain a profit factor of 2.0 or higher over 30 trades.",
    type: "PROFITABILITY" as const,
    targetMetrics: { profitFactor: 2.0, minTrades: 30 },
  },
  {
    name: "No Revenge Trades",
    description: "Go 2 weeks without logging a FOMO or Revenge mistake tag.",
    type: "DISCIPLINE" as const,
    targetMetrics: { days: 14 },
  },
  {
    name: "Risk Management Master",
    description: "Keep max drawdown below 5% for 30 days.",
    type: "CONSISTENCY" as const,
    targetMetrics: { maxDrawdownPct: 5, days: 30 },
  },
];

export default function Challenges() {
  const { data, isLoading } = useChallenges();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "CONSISTENCY" as Challenge["type"], startDate: new Date().toISOString().slice(0, 10), endDate: "" });

  const createMutation = useMutation({
    mutationFn: (body: any) => fetch(`${API}/challenges`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["challenges"] }); setShowCreate(false); toast({ title: "Challenge created!" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => fetch(`${API}/challenges/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["challenges"] }); toast({ title: "Challenge updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${API}/challenges/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["challenges"] }); toast({ title: "Challenge deleted" }); },
  });

  const challenges = data?.challenges || [];
  const active = challenges.filter(c => c.status === "ACTIVE");
  const completed = challenges.filter(c => c.status === "COMPLETED");
  const failed = challenges.filter(c => c.status === "FAILED");

  const handlePreset = (preset: typeof PRESET_CHALLENGES[0]) => {
    createMutation.mutate({ ...preset, startDate: new Date().toISOString() });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Challenges</h1>
          <p className="text-muted-foreground mt-1 text-lg">Set goals and level up your trading discipline.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Challenge
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p className="text-3xl font-bold font-mono text-foreground">{completed.length}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="glass-panel rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-3xl font-bold font-mono text-foreground">{active.length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="glass-panel rounded-2xl p-6 text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 text-orange-500" />
          <p className="text-3xl font-bold font-mono text-foreground">{challenges.length}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Active Challenges */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active Challenges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(c => <ChallengeCard key={c.id} challenge={c} onUpdate={updateMutation.mutate} onDelete={deleteMutation.mutate} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map(c => <ChallengeCard key={c.id} challenge={c} onUpdate={updateMutation.mutate} onDelete={deleteMutation.mutate} />)}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No challenges yet</h3>
              <p className="text-muted-foreground mb-6">Start with a preset challenge or create your own.</p>
            </div>
          )}

          {/* Preset Challenges */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preset Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_CHALLENGES.map((preset, i) => {
                const typeConfig = CHALLENGE_TYPES.find(t => t.value === preset.type)!;
                const Icon = typeConfig.icon;
                return (
                  <div key={i} className={`glass-panel rounded-2xl p-5 border ${typeConfig.border} group hover:scale-[1.02] transition-transform`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                        <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <Badge variant="outline" className={`text-xs ${typeConfig.color} border-current`}>{typeConfig.label}</Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handlePreset(preset)} disabled={createMutation.isPending}>
                      Start Challenge
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Challenge name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's the challenge?" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {CHALLENGE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value as Challenge["type"] }))}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      form.type === t.value ? `${t.bg} ${t.border} ${t.color}` : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start Date</label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">End Date (optional)</label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => createMutation.mutate({ ...form, startDate: new Date(form.startDate).toISOString(), endDate: form.endDate ? new Date(form.endDate).toISOString() : null })}
              disabled={!form.name || createMutation.isPending}
            >
              Create Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChallengeCard({ challenge, onUpdate, onDelete }: { challenge: Challenge; onUpdate: (data: any) => void; onDelete: (id: number) => void }) {
  const typeConfig = CHALLENGE_TYPES.find(t => t.value === challenge.type)!;
  const statusConfig = STATUS_CONFIG[challenge.status];
  const Icon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  const progress = Math.min(100, Math.max(0, parseFloat(challenge.progress as unknown as string)));

  return (
    <div className={`glass-panel rounded-2xl p-5 border ${typeConfig.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
            <Icon className={`w-5 h-5 ${typeConfig.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{challenge.name}</h3>
            <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>
        <button onClick={() => onDelete(challenge.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {challenge.description && <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${challenge.status === "COMPLETED" ? "bg-emerald-500" : challenge.status === "FAILED" ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {challenge.status === "ACTIVE" && (
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onUpdate({ id: challenge.id, status: "COMPLETED", progress: 100 })}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            Complete
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs text-red-500 hover:text-red-500" onClick={() => onUpdate({ id: challenge.id, status: "FAILED" })}>
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Mark Failed
          </Button>
        </div>
      )}
    </div>
  );
}
