import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTrade } from "@workspace/api-client-react";
import { getGetTradesQueryKey, getGetDashboardAnalyticsQueryKey, getGetCalendarDataQueryKey, getGetWeeklyReviewQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Schema matching CreateTradeRequest
const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  assetClass: z.enum(["STOCK", "CRYPTO", "OPTION", "FUTURES", "FOREX"]),
  direction: z.enum(["LONG", "SHORT"]),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().positive("Exit price must be positive"),
  entryTime: z.string().min(1, "Entry time is required"),
  exitTime: z.string().min(1, "Exit time is required"),
  commissions: z.coerce.number().min(0).default(0),
  fees: z.coerce.number().min(0).default(0),
  setupTag: z.string().optional(),
  mistakeTag: z.string().optional(),
  emotionTag: z.string().optional(),
  notes: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

const SETUPS = ["Bull Flag", "Bear Flag", "Breakout", "Reversal", "Momentum", "Pullback", "Range", "Other"];
const MISTAKES = ["None", "FOMO", "No Stop Loss", "Chasing", "Oversize", "Early Exit", "Revenge Trade", "Other"];
const EMOTIONS = ["Neutral", "Confident", "Fearful", "Greedy", "Calm", "Frustrated", "FOMO", "Other"];

export default function AddTradeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createTradeMutation = useCreateTrade();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: "",
      assetClass: "STOCK",
      direction: "LONG",
      commissions: 0,
      fees: 0,
    }
  });

  const onSubmit = (data: TradeFormValues) => {
    createTradeMutation.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Trade logged successfully",
          description: `Logged ${data.direction} trade for ${data.symbol}`,
        });
        queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalendarDataQueryKey() });
        queryClient.invalidateQueries({ queryKey: [getGetWeeklyReviewQueryKey()[0]] });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to log trade",
          description: error.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border">
          <DialogTitle className="text-2xl font-display">Log a New Trade</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Enter the details of your completed trade below to track its performance.
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input placeholder="AAPL, BTC..." {...form.register("symbol")} className="uppercase bg-background" />
              {form.formState.errors.symbol && <p className="text-xs text-destructive">{form.formState.errors.symbol.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Asset Class</Label>
              <Select onValueChange={(v) => form.setValue("assetClass", v as any)} defaultValue={form.getValues("assetClass")}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK">Stock</SelectItem>
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                  <SelectItem value="OPTION">Option</SelectItem>
                  <SelectItem value="FUTURES">Futures</SelectItem>
                  <SelectItem value="FOREX">Forex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Direction</Label>
              <Select onValueChange={(v) => form.setValue("direction", v as any)} defaultValue={form.getValues("direction")}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select direction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="any" placeholder="100" {...form.register("quantity")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input type="number" step="any" placeholder="150.25" {...form.register("entryPrice")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Exit Price</Label>
              <Input type="number" step="any" placeholder="155.00" {...form.register("exitPrice")} className="bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entry Time</Label>
              <Input type="datetime-local" {...form.register("entryTime")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Exit Time</Label>
              <Input type="datetime-local" {...form.register("exitTime")} className="bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Setup</Label>
              <Select onValueChange={(v) => form.setValue("setupTag", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="No setup" /></SelectTrigger>
                <SelectContent>
                  {SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mistake</Label>
              <Select onValueChange={(v) => form.setValue("mistakeTag", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="No mistake" /></SelectTrigger>
                <SelectContent>
                  {MISTAKES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emotion</Label>
              <Select onValueChange={(v) => form.setValue("emotionTag", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Neutral" /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Journal Notes</Label>
            <Textarea 
              placeholder="What went well? What could be improved?" 
              {...form.register("notes")} 
              className="bg-background min-h-[100px] resize-none" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createTradeMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 shadow-lg shadow-primary/20">
              {createTradeMutation.isPending ? "Saving..." : "Save Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
