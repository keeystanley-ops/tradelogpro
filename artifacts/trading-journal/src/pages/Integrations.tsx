import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { 
  getGetTradesQueryKey, 
  getGetWeeklyReviewQueryKey, 
  getGetDashboardAnalyticsQueryKey, 
  getGetCalendarDataQueryKey 
} from "@workspace/api-client-react";
import {
  Link2, CheckCircle2, XCircle, Upload, FileUp, AlertCircle,
  RefreshCw, Clock, Wifi, WifiOff, ChevronRight, X, Eye, Download,
  Binary, ShieldCheck, Server, Key, Trash2, Search, Zap, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const POPULAR_SERVERS = [
  "ICMarkets-SC-Live",
  "Pepperstone-Live",
  "Exness-Real",
  "FTMO-Server",
  "OANDA-Live",
  "ForexTime-Live",
  "FBS-Real",
  "Deriv-Server",
  "VantageInternational-Live"
];

const BROKERS = [
  {
    id: "mt4",
    name: "MetaTrader 4 / 5",
    logo: "MT",
    logoColor: "bg-blue-600",
    description: "Connect your MetaTrader account via API",
    status: "available",
    assetClasses: ["Forex", "CFDs", "Futures"],
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    logo: "IB",
    logoColor: "bg-red-600",
    description: "Sync trades from IBKR TWS or API",
    status: "coming_soon",
    assetClasses: ["Stocks", "Options", "Futures", "Forex"],
  },
  {
    id: "csv",
    name: "CSV / Excel Import",
    logo: "CSV",
    logoColor: "bg-primary",
    description: "Upload trade history from any broker",
    status: "available",
    assetClasses: ["All asset classes"],
  },
];

const API = "/api/integrations";

export default function Integrations() {
  const [csvOpen, setCsvOpen] = useState(false);
  const [mt4Open, setMt4Open] = useState(false);
  const [mt4Form, setMt4Form] = useState({
    accountName: "",
    provider: "MT5",
    serverAddress: "",
    login: "",
    password: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: integrationsData, isLoading: integrationsLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => customFetch(`${API}`) as Promise<{ integrations: any[] }>
  });

  const integrations = integrationsData?.integrations || [];

  // Mutations
  const linkMutation = useMutation({
    mutationFn: (body: any) => customFetch(API, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setMt4Open(false);
      toast({ title: "Account Linked!", description: "Live trade sync is now active." });
    },
    onError: () => toast({ title: "Connection Failed", description: "Invalid credentials or server address.", variant: "destructive" })
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => customFetch(`${API}/${id}/sync`, { method: "POST" }) as Promise<{ imported: number }>,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
      toast({ 
        title: "Sync Successful", 
        description: data.imported > 0 ? `Imported ${data.imported} new trades from the MT server.` : "Your account is already up to date.",
        variant: data.imported > 0 ? "default" : "default"
      });
    },
    onError: () => toast({ title: "Sync Failed", description: "Could not connect to the broker server.", variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customFetch(`${API}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Account Disconnected" });
    }
  });

  const handleMt4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    linkMutation.mutate(mt4Form);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium italic">Bridge your MetaTrader account for real-time automated journaling.</p>
        </div>
      </div>

      {/* Active High-End Integrated Cards */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Authenticated Connections</h2>
        {integrations.length === 0 ? (
          <div className="glass-panel border-dashed rounded-[40px] p-16 text-center border-2 border-border/40 hover:bg-muted/5 transition-all duration-700">
            <Link2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-bold">No active server links</p>
            <p className="text-xs text-muted-foreground mt-1">Connect your MT4/MT5 account to see real-time trade updates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((acc: any) => (
              <div key={acc.id} className="glass-panel group relative overflow-hidden rounded-[40px] p-8 border border-primary/10 bg-gradient-to-tr from-card to-primary/[0.03] transition-all hover:shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.1)]">
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest h-9 px-4 gap-2 border border-primary/10"
                        onClick={() => syncMutation.mutate(acc.id)}
                        disabled={syncMutation.isPending}
                    >
                        {syncMutation.isPending && syncMutation.variables === acc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Sync Now
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground" onClick={() => deleteMutation.mutate(acc.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-2xl shadow-blue-600/30">
                        {acc.provider}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground">{acc.accountName}</h3>
                        <div className="flex items-center gap-3 mt-1.5 font-bold">
                            <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] uppercase tracking-[0.1em]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Link
                            </span>
                            <span className="text-muted-foreground/40 font-light">|</span>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.1em]">{acc.login}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-background/50 border border-border/40 backdrop-blur-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Server</p>
                        <p className="text-xs font-bold text-foreground truncate">{acc.serverAddress}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-background/50 border border-border/40 backdrop-blur-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Last Sync</p>
                        <p className="text-xs font-bold text-foreground italic">
                            {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleTimeString() : 'Never'}
                        </p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration Options */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Available Integration Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BROKERS.map(broker => (
            <div key={broker.id} className="glass-panel p-8 rounded-[40px] border border-border/40 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-card to-muted/10">
              <div className="flex items-start gap-6">
                <div className={`w-20 h-20 rounded-[28px] ${broker.logoColor} flex items-center justify-center text-white text-2xl font-black shadow-xl group-hover:scale-105 transition-transform shrink-0`}>
                  {broker.logo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black tracking-tight">{broker.name}</h3>
                    {broker.status === "available" && (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black italic rounded-full uppercase px-3 h-5">DIRECT-API</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-4">{broker.description}</p>
                  <Button 
                    className="rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-primary/20"
                    disabled={broker.status !== "available"}
                    onClick={() => broker.id === 'mt4' ? setMt4Open(true) : setCsvOpen(true)}
                  >
                    {broker.status === "available" ? (
                        <>Connect Link <ChevronRight className="w-4 h-4" /></>
                    ) : 'Join Waitlist'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MetaTrader Link Dialog */}
      <Dialog open={mt4Open} onOpenChange={setMt4Open}>
        <DialogContent className="max-w-2xl bg-card border-none rounded-[48px] p-0 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-5 h-[600px]">
                {/* Visual Side */}
                <div className="col-span-2 bg-primary relative overflow-hidden p-10 flex flex-col justify-between text-white">
                    <div className="absolute top-0 right-0 p-20 scale-150 rotate-12 opacity-10 blur-3xl">
                        <Zap className="w-80 h-80" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-4">REAL-TIME<br/>BRIDGE</h2>
                        <div className="w-12 h-1.5 bg-white/30 rounded-full" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 mt-1 opacity-60" />
                            <p className="text-sm font-bold leading-tight opacity-90 text-white/80">AES-256 Military Grade Encryption for all credentials.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Binary className="w-6 h-6 mt-1 opacity-60" />
                            <p className="text-sm font-bold leading-tight opacity-90 text-white/80">Low-latency bridge to global MetaTrader servers.</p>
                        </div>
                    </div>
                    <div className="text-[10px] opacity-40 font-black uppercase tracking-[0.2em]">Insight Core v4.1</div>
                </div>

                {/* Form Side */}
                <div className="col-span-3 p-12 bg-card/80 backdrop-blur-xl relative">
                    <form onSubmit={handleMt4Submit} className="h-full flex flex-col">
                        <h2 className="text-2xl font-black mb-8">Link Account</h2>
                        
                        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Platform</Label>
                                    <Select value={mt4Form.provider} onValueChange={v => setMt4Form({ ...mt4Form, provider: v })}>
                                        <SelectTrigger className="rounded-2xl h-12 bg-muted/30 border-none font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MT4">MetaTrader 4</SelectItem>
                                            <SelectItem value="MT5">MetaTrader 5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Account Label</Label>
                                    <Input 
                                        placeholder="Main Live" 
                                        className="rounded-2xl h-12 bg-muted/30 border-none font-bold"
                                        value={mt4Form.accountName}
                                        onChange={e => setMt4Form({ ...mt4Form, accountName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Broker Server Address</Label>
                                <div className="relative group">
                                    <Input 
                                        placeholder="Search or enter server..." 
                                        className="rounded-2xl h-12 bg-muted/30 border-none font-bold pl-10"
                                        value={mt4Form.serverAddress}
                                        onChange={e => setMt4Form({ ...mt4Form, serverAddress: e.target.value })}
                                    />
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {POPULAR_SERVERS.slice(0, 3).map(s => (
                                        <button 
                                            key={s} 
                                            type="button" 
                                            onClick={() => setMt4Form({ ...mt4Form, serverAddress: s })}
                                            className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors border border-border"
                                        >
                                            {s.split('-')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Account Number (Login)</Label>
                                    <Input 
                                        placeholder="00000000" 
                                        className="rounded-2xl h-12 bg-muted/30 border-none font-bold"
                                        value={mt4Form.login}
                                        onChange={e => setMt4Form({ ...mt4Form, login: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Trading Password</Label>
                                    <Input 
                                        type="password"
                                        placeholder="••••••••" 
                                        className="rounded-2xl h-12 bg-muted/30 border-none font-bold"
                                        value={mt4Form.password}
                                        onChange={e => setMt4Form({ ...mt4Form, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button 
                                type="submit" 
                                className="w-full h-14 rounded-3xl bg-primary text-white font-black text-lg gap-3 shadow-2xl shadow-primary/20"
                                disabled={linkMutation.isPending}
                            >
                                {linkMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'AUTHENTICATE & LINK'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
