import { motion, AnimatePresence } from "framer-motion";
import { useGetTrade, useUpdateTrade, useDeleteTrade, useGetAIAnalysis } from "@workspace/api-client-react";
import { getGetTradesQueryKey, getGetDashboardAnalyticsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Clock, DollarSign, Activity, Trash2, Brain, Sparkles, CheckCircle2, AlertCircle, Zap, ShieldCheck, ImageIcon, Plus, Percent, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatPercent, formatDateTime, formatDuration } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TradeDrawer({ tradeId, onClose }: { tradeId: number | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: trade, isLoading } = useGetTrade(tradeId || 0, { query: { enabled: !!tradeId } });
  const { data: aiAnalysis, isLoading: isLoadingAI } = useGetAIAnalysis(tradeId || 0);
  const updateMutation = useUpdateTrade();
  const deleteMutation = useDeleteTrade();

  const [notes, setNotes] = useState("");
  const [setup, setSetup] = useState("");
  const [mistake, setMistake] = useState("");
  const [emotion, setEmotion] = useState("");
  const [screenshots, setScreenshots] = useState<any>({ before: null, during: null, after: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || "");
      setSetup(trade.setupTag || "");
      setMistake(trade.mistakeTag || "");
      setEmotion(trade.emotionTag || "");
      setScreenshots(trade.screenshots || { before: null, during: null, after: null });
    }
  }, [trade]);

  const handleSave = () => {
    if (!tradeId) return;
    updateMutation.mutate({
      id: tradeId,
      data: { notes, setupTag: setup, mistakeTag: mistake, emotionTag: emotion, screenshots }
    }, {
      onSuccess: () => {
        toast({ title: "Trade updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
      }
    });
  };

  const handleDelete = () => {
    if (!tradeId || !confirm("Are you sure you want to delete this trade?")) return;
    deleteMutation.mutate({ id: tradeId }, {
      onSuccess: () => {
        toast({ title: "Trade deleted" });
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
        onClose();
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setScreenshots((prev: any) => ({ ...prev, [uploadTarget]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const isProfit = trade && parseFloat(trade.netPnl || "0") > 0;

  return (
    <AnimatePresence>
      {tradeId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-[0_0_100px_rgba(0,0,0,0.5)] z-50 overflow-y-auto no-scrollbar pb-20"
          >
            {isLoading || !trade ? (
              <div className="p-8 animate-pulse space-y-6">
                <div className="h-12 bg-white/5 rounded-lg w-1/2"></div>
                <div className="h-32 bg-white/5 rounded-lg"></div>
                <div className="h-64 bg-white/5 rounded-lg"></div>
              </div>
            ) : (
              <div className="flex flex-col min-h-full">
                {/* Visual Header */}
                <div className="p-8 border-b border-border bg-card/50 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${isProfit ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`} />
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{trade.symbol}</h2>
                            <Badge className={trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} variant="outline">
                            {trade.direction}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span>Ticket: {trade.ticketId || "INTERNAL"}</span>
                            <span>|</span>
                            <span>Broker: {trade.brokerName || "MT5 Link"}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl hover:bg-white/10 h-10 w-10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">REALIZED P&L</p>
                      <p className={`text-6xl font-black italic tracking-tighter ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatMoney(parseFloat(trade.netPnl || "0"))}
                      </p>
                    </div>
                    {trade.marketSession && (
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5 text-primary" />
                             <span className="text-[10px] font-black italic uppercase text-primary">{trade.marketSession} SESSION</span>
                        </div>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-10">
                   {/* MetaTrader Deep Info */}
                   <div className="grid grid-cols-4 gap-3">
                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/40">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">R-Ratio</p>
                            <p className="text-sm font-black italic text-foreground">{trade.rrRatio || "0"}R</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/40">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Commission</p>
                            <p className="text-sm font-black text-rose-500/60 ">{formatMoney(parseFloat(trade.commission || "0"))}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/40">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Swap</p>
                            <p className="text-sm font-black text-muted-foreground">{formatMoney(parseFloat(trade.swap || "0"))}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-2xl border border-border/40">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Timeframe</p>
                            <p className="text-sm font-black text-foreground">{trade.timeframe || "M5"}</p>
                        </div>
                   </div>

                   {/* Screenshot System */}
                   <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Visual Evidence
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {['before', 'during', 'after'].map((key) => (
                                <div 
                                    key={key} 
                                    className="aspect-video bg-muted/20 rounded-2xl border-2 border-dashed border-border/40 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all"
                                    onClick={() => { setUploadTarget(key); fileInputRef.current?.click(); }}
                                >
                                    {screenshots[key] ? (
                                        <img src={screenshots[key]} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 gap-1">
                                            <Plus className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-white uppercase">Replace</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </div>

                   {/* AI Insight Bridge */}
                   <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/20 relative group">
                        <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-primary animate-pulse" />
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live MT-Bridge Analysis</span>
                        </div>
                        {isLoadingAI ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-3 bg-primary/10 rounded w-full" />
                                <div className="h-3 bg-primary/10 rounded w-2/3" />
                            </div>
                        ) : aiAnalysis ? (
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-foreground leading-relaxed italic opacity-80">
                                    {aiAnalysis.recommendations?.split('\n')[0]}
                                </p>
                                <div className="flex gap-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black italic">PROBABILITY: 84%</Badge>
                                    <Badge className="bg-violet-500/10 text-violet-500 border-none text-[9px] font-black italic">DISCIPLINE: {aiAnalysis.qualityScore}%</Badge>
                                </div>
                            </div>
                        ) : (
                            <Button className="w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20">Generate Live Insight</Button>
                        )}
                   </div>

                   {/* Execution Details & Manual Entry */}
                   <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/40">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Setup Tag</Label>
                            <Select value={setup} onValueChange={setSetup}>
                                <SelectTrigger className="rounded-2xl bg-muted/20 border-none h-12 font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {["Bull Flag", "Bear Flag", "Breakout", "Order Block", "FVG Gap", "Reversal", "Trend Following"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Mistake Tag</Label>
                            <Select value={mistake} onValueChange={setMistake}>
                                <SelectTrigger className="rounded-2xl bg-muted/20 border-none h-12 font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {["None", "Fomo Entry", "Early Exit", "Over Leveraged", "Stop Loss Hunted", "News Event"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-2 pt-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Post-Execution Notes</Label>
                            <Textarea 
                                className="rounded-3xl bg-muted/20 border-none min-h-[120px] p-6 font-medium text-sm no-scrollbar focus:ring-1 ring-primary/20 transition-all"
                                placeholder="Describe your emotional state and the 'Why' behind this execution..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                   </div>
                </div>

                <div className="px-8 mt-auto flex flex-col gap-4">
                    <Button 
                        onClick={handleSave} 
                        className="w-full h-16 rounded-[28px] bg-foreground text-background font-black uppercase tracking-widest text-lg shadow-2xl hover:scale-[1.02] transition-transform"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? "Syncing..." : "Commit Review"}
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <Button 
                        variant="ghost" 
                        className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
                        onClick={handleDelete}
                    >
                        Permanently Wipe Trade History
                    </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
