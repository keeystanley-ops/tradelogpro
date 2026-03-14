import { motion, AnimatePresence } from "framer-motion";
import { useGetTrade, useUpdateTrade, useDeleteTrade } from "@workspace/api-client-react";
import { getGetTradesQueryKey, getGetDashboardAnalyticsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Clock, DollarSign, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatPercent, formatDateTime, formatDuration } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TradeDrawer({ tradeId, onClose }: { tradeId: number | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: trade, isLoading } = useGetTrade(tradeId || 0, { query: { enabled: !!tradeId } });
  const updateMutation = useUpdateTrade();
  const deleteMutation = useDeleteTrade();

  const [notes, setNotes] = useState("");
  const [setup, setSetup] = useState("");
  const [mistake, setMistake] = useState("");
  const [emotion, setEmotion] = useState("");

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || "");
      setSetup(trade.setupTag || "");
      setMistake(trade.mistakeTag || "");
      setEmotion(trade.emotionTag || "");
    }
  }, [trade]);

  const handleSave = () => {
    if (!tradeId) return;
    updateMutation.mutate({
      id: tradeId,
      data: { notes, setupTag: setup, mistakeTag: mistake, emotionTag: emotion }
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

  const isProfit = trade && trade.netPnl > 0;

  return (
    <AnimatePresence>
      {tradeId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-y-auto"
          >
            {isLoading || !trade ? (
              <div className="p-8 animate-pulse space-y-6">
                <div className="h-12 bg-white/5 rounded-lg w-1/2"></div>
                <div className="h-32 bg-white/5 rounded-lg"></div>
                <div className="h-64 bg-white/5 rounded-lg"></div>
              </div>
            ) : (
              <div className="flex flex-col min-h-full">
                {/* Header */}
                <div className="p-6 border-b border-border bg-background relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${isProfit ? 'bg-profit' : 'bg-loss'}`} />
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-display font-bold uppercase">{trade.symbol}</h2>
                        <Badge className={trade.direction === 'LONG' ? 'bg-profit/20 text-profit border-profit/30' : 'bg-loss/20 text-loss border-loss/30'} variant="outline">
                          {trade.direction}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm flex items-center gap-2">
                        {formatDateTime(trade.entryTime)} 
                        <span className="text-border">&rarr;</span> 
                        {formatDateTime(trade.exitTime)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="mt-6 flex items-baseline gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Net P&L</p>
                      <p className={`text-4xl font-display font-bold data-value ${isProfit ? 'text-profit' : 'text-loss'}`}>
                        {formatMoney(trade.netPnl)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-8 flex-1">
                  
                  {/* Grid Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">Entry Price</span>
                      </div>
                      <p className="text-lg font-mono">{formatMoney(trade.entryPrice)}</p>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm font-medium">Exit Price</span>
                      </div>
                      <p className="text-lg font-mono">{formatMoney(trade.exitPrice)}</p>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Quantity</span>
                      </div>
                      <p className="text-lg font-mono">{trade.quantity}</p>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Duration</span>
                      </div>
                      <p className="text-lg font-mono">{formatDuration(trade.durationSeconds)}</p>
                    </div>
                  </div>

                  {/* Enrichment Form */}
                  <div className="space-y-4">
                    <h3 className="font-display font-semibold text-lg border-b border-border pb-2">Trade Analysis</h3>
                    
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm text-muted-foreground">Setup</label>
                        <Select value={setup} onValueChange={setSetup}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select setup" /></SelectTrigger>
                          <SelectContent>
                            {["Bull Flag", "Bear Flag", "Breakout", "Reversal", "Momentum", "Pullback", "Range", "Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-muted-foreground">Mistake</label>
                        <Select value={mistake} onValueChange={setMistake}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select mistake" /></SelectTrigger>
                          <SelectContent>
                            {["None", "FOMO", "No Stop Loss", "Chasing", "Oversize", "Early Exit", "Revenge Trade", "Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-muted-foreground">Emotion</label>
                        <Select value={emotion} onValueChange={setEmotion}>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Select emotion" /></SelectTrigger>
                          <SelectContent>
                            {["Neutral", "Confident", "Fearful", "Greedy", "Calm", "Frustrated", "FOMO", "Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-sm text-muted-foreground">Notes</label>
                      <Textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        className="bg-background min-h-[120px] resize-none"
                        placeholder="Add your post-trade analysis here..."
                      />
                    </div>

                    <Button 
                      onClick={handleSave} 
                      disabled={updateMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Analysis"}
                    </Button>
                  </div>

                  <div className="pt-8 flex justify-center">
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Trade
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
