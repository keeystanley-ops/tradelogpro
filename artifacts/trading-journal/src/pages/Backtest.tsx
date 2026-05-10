import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Plus, 
  Play, 
  Trash2, 
  Copy, 
  Search, 
  Calendar, 
  Clock, 
  BarChart2, 
  TrendingUp,
  History,
  MoreVertical,
  Layers
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Backtest() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  // Form state for new session
  const [newSession, setNewSession] = useState({
    name: "",
    symbol: "BTCUSDT",
    marketType: "CRYPTO",
    timeframe: "1h",
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    notes: ""
  });

  // Queries
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/backtest/sessions"],
    queryFn: async () => {
      const res = await fetch("/api/backtest/sessions", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    }
  });

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof newSession) => {
      const res = await fetch("/api/backtest/sessions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtest/sessions"] });
      setIsNewSessionOpen(false);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/backtest/sessions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to delete session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtest/sessions"] });
    }
  });

  const duplicateSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/backtest/sessions/${id}/duplicate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to duplicate session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtest/sessions"] });
    }
  });

  const filteredSessions = sessions?.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Total Sessions", value: sessions?.length || 0, icon: Layers, color: "text-blue-500" },
    { label: "Win Rate", value: "64%", icon: BarChart2, color: "text-green-500" },
    { label: "Avg RR", value: "2.4", icon: TrendingUp, color: "text-purple-500" },
    { label: "Total PnL", value: "+$12,450", icon: History, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtest</h1>
          <p className="text-muted-foreground mt-1">
            Replay historical market data and refine your edge.
          </p>
        </div>
        <Button 
          onClick={() => setIsNewSessionOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-stats gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none bg-card/40 backdrop-blur-sm shadow-xl ring-1 ring-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-background/50 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card className="border-none bg-card/40 backdrop-blur-sm shadow-2xl ring-1 ring-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Sessions</CardTitle>
            <CardDescription>Your saved backtesting sessions</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search sessions..." 
              className="pl-9 bg-background/50 border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredSessions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              <AnimatePresence>
                {filteredSessions.map((session: any) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group relative border-white/5 bg-background/30 hover:bg-background/50 transition-all duration-300 overflow-hidden cursor-pointer"
                      onClick={() => setLocation(`/backtest/${session.id}`)}
                    >
                      <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-50" />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{session.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                {session.symbol}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                                {session.timeframe}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-white/10">
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/backtest/${session.id}`);
                                }}
                              >
                                <Play className="w-4 h-4 text-primary" />
                                Resume
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateSessionMutation.mutate(session.id);
                                }}
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSessionMutation.mutate(session.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(session.startDate), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(session.updatedAt), "HH:mm")}
                            </div>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-muted-foreground/60 line-clamp-2 italic">
                              "{session.notes}"
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <div className="p-4 rounded-full bg-muted/20">
                <Layers className="w-8 h-8 opacity-20" />
              </div>
              <p>No sessions found. Create your first one to start backtesting!</p>
              <Button variant="outline" onClick={() => setIsNewSessionOpen(true)}>
                Create Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Session Dialog */}
      <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create Backtest Session</DialogTitle>
            <DialogDescription>
              Configure your backtesting environment and historical data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Session Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. BTC Breakout Strategy" 
                className="bg-background/50 border-white/10"
                value={newSession.name}
                onChange={(e) => setNewSession({...newSession, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Instrument</Label>
                <Input 
                  id="symbol" 
                  placeholder="BTCUSDT, EURUSD..." 
                  className="bg-background/50 border-white/10 uppercase"
                  value={newSession.symbol}
                  onChange={(e) => setNewSession({...newSession, symbol: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketType">Market Type</Label>
                <Select 
                  value={newSession.marketType} 
                  onValueChange={(v) => setNewSession({...newSession, marketType: v})}
                >
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    <SelectItem value="CRYPTO">Crypto</SelectItem>
                    <SelectItem value="FOREX">Forex</SelectItem>
                    <SelectItem value="STOCKS">Stocks</SelectItem>
                    <SelectItem value="INDICES">Indices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select 
                  value={newSession.timeframe} 
                  onValueChange={(v) => setNewSession({...newSession, timeframe: v})}
                >
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    <SelectItem value="1m">1 minute</SelectItem>
                    <SelectItem value="5m">5 minutes</SelectItem>
                    <SelectItem value="15m">15 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="4h">4 hours</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  className="bg-background/50 border-white/10"
                  value={newSession.startDate}
                  onChange={(e) => setNewSession({...newSession, startDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input 
                id="notes" 
                placeholder="Session goals or strategy details..." 
                className="bg-background/50 border-white/10"
                value={newSession.notes}
                onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSessionOpen(false)} className="border-white/10 hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              onClick={() => createSessionMutation.mutate(newSession)}
              disabled={!newSession.name || !newSession.symbol || createSessionMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createSessionMutation.isPending ? "Creating..." : "Start Backtesting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
