import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Settings, 
  Save, 
  BarChart, 
  History, 
  Target,
  Maximize2,
  Info
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import BacktestChart from "@/components/backtest/BacktestChart";
import BacktestToolbar from "@/components/backtest/BacktestToolbar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import TradingViewEmbed from "@/components/backtest/TradingViewEmbed";

export default function BacktestSession() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Replay State
  const [allData, setAllData] = useState<any[]>([]);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  
  // Trading State
  const [activePosition, setActivePosition] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Queries
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["/api/backtest/sessions", id],
    queryFn: async () => {
      const res = await fetch(`/api/backtest/sessions/${id}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!id
  });

  // Multi-Timeframe State
  const [htfData, setHtfData] = useState<any[]>([]);
  const htfTimeframe = useMemo(() => {
    const t = session?.timeframe;
    if (t === '1m') return '5m';
    if (t === '5m') return '15m';
    if (t === '15m') return '1h';
    if (t === '1h') return '4h';
    if (t === '4h') return '1d';
    return '1d';
  }, [session?.timeframe]);

  const [showHTF, setShowHTF] = useState(true);

  // Fetch Market Data
  const { isLoading: isDataLoading } = useQuery({
    queryKey: ["market-data", session?.symbol, session?.timeframe, session?.startDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol: session.symbol,
        timeframe: session.timeframe,
        start: session.startDate,
      });
      const res = await fetch(`/api/backtest/market-data?${params}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch market data");
      const data = await res.json();
      setAllData(data);
      
      // If we have a saved replay point, find its index
      if (session.replayPoint) {
          const replayTime = new Date(session.replayPoint).getTime() / 1000;
          const index = data.findIndex((d: any) => d.time >= replayTime);
          const startIdx = index !== -1 ? index : 20; 
          setCurrentIndex(startIdx);
          setVisibleData(data.slice(0, startIdx + 1));
      } else {
          setCurrentIndex(20);
          setVisibleData(data.slice(0, 21));
      }
      
      return data;
    },
    enabled: !!session
  });

  // Fetch HTF Data
  const { isLoading: isHTFLoading } = useQuery({
    queryKey: ["market-data-htf", session?.symbol, htfTimeframe, session?.startDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        symbol: session.symbol,
        timeframe: htfTimeframe,
        start: session.startDate,
      });
      const res = await fetch(`/api/backtest/market-data?${params}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch HTF market data");
      const data = await res.json();
      setHtfData(data);
      return data;
    },
    enabled: !!session && showHTF
  });

  // Sync visible HTF data based on current index time
  const visibleHtfData = useMemo(() => {
    if (!visibleData.length || !htfData.length) return [];
    const currentTime = visibleData[visibleData.length - 1].time;
    return htfData.filter(d => d.time <= currentTime);
  }, [visibleData, htfData]);

  // Replay Logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        handleNext();
      }, 1000 / speed);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speed, currentIndex, allData]);

  const handleNext = () => {
    if (currentIndex < allData.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVisibleData(allData.slice(0, nextIdx + 1));
    } else {
      setIsPlaying(false);
      toast({ title: "End of historical data reached" });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      setVisibleData(allData.slice(0, nextIdx + 1));
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(20);
    setVisibleData(allData.slice(0, 21));
    setMarkers([]);
    setActivePosition(null);
  };

  const handleOpenTrade = (direction: 'LONG' | 'SHORT') => {
    if (activePosition) {
        toast({ title: "Close current position first", variant: "destructive" });
        return;
    }
    
    const entryPrice = allData[currentIndex].close;
    const entryTime = allData[currentIndex].time;
    
    setActivePosition({
        direction,
        entryPrice,
        entryTime,
        quantity: 1, // Mock qty
    });

    setMarkers(prev => [...prev, {
        time: entryTime,
        position: direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: direction === 'LONG' ? '#10B981' : '#EF4444',
        shape: direction === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `BUY @ ${entryPrice.toFixed(2)}`
    }]);

    toast({ title: `${direction} Position Opened` });
  };

  const handleClosePosition = async () => {
      if (!activePosition) return;
      
      const exitPrice = allData[currentIndex].close;
      const exitTime = allData[currentIndex].time;
      const { direction, entryPrice, entryTime } = activePosition;
      
      const pnl = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      
      setMarkers(prev => [...prev, {
          time: exitTime,
          position: direction === 'LONG' ? 'aboveBar' : 'belowBar',
          color: '#7C3AED',
          shape: 'circle',
          text: `EXIT | PnL: ${pnl.toFixed(2)}`
      }]);

      // Save to Journal
      try {
          await fetch('/api/trades', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({
                  symbol: session.symbol,
                  assetClass: session.marketType,
                  direction,
                  quantity: 1,
                  entryPrice,
                  exitPrice,
                  entryTime: new Date(entryTime * 1000),
                  exitTime: new Date(exitTime * 1000),
                  is_backtest: true,
                  backtest_session_id: session.id,
                  notes: `Backtest Trade | Session: ${session.name}`
              })
          });
          toast({ title: "Trade saved to journal" });
      } catch (err) {
          toast({ title: "Failed to save trade", variant: "destructive" });
      }

      setActivePosition(null);
  };

  const saveReplayPoint = useMutation({
      mutationFn: async () => {
          const replayPoint = new Date(allData[currentIndex].time * 1000);
          await fetch(`/api/backtest/sessions/${id}`, {
              method: 'PATCH',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ replayPoint })
          });
      },
      onSuccess: () => {
          toast({ title: "Session progress saved" });
      }
  });

  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  if (isSessionLoading) return <div className="h-screen flex items-center justify-center">Loading session...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-6 md:-m-10 overflow-hidden bg-[#0a0a0b]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-card/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLocation("/backtest")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold">{session?.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 text-[10px] py-0 border-white/10 uppercase">{session?.symbol}</Badge>
              <span className="text-[10px] text-muted-foreground">{session?.timeframe}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Analysis Toggle */}
          <div className="flex items-center bg-background/50 rounded-lg p-0.5 border border-white/5 mr-4">
            <Button 
              size="sm" 
              variant={isAnalysisMode ? "ghost" : "secondary"} 
              className="h-7 text-[10px] rounded-md px-3"
              onClick={() => setIsAnalysisMode(false)}
            >
              REPLAY ENGINE
            </Button>
            <Button 
              size="sm" 
              variant={isAnalysisMode ? "secondary" : "ghost"} 
              className="h-7 text-[10px] rounded-md px-3"
              onClick={() => setIsAnalysisMode(true)}
            >
              TV ANALYSIS
            </Button>
          </div>

          <div className="flex items-center bg-background/50 rounded-lg p-0.5 border border-white/5 mr-4">
            <Button 
               size="sm" 
               variant={showHTF ? "secondary" : "ghost"} 
               className="h-7 text-[10px] rounded-md px-3"
               onClick={() => setShowHTF(!showHTF)}
               disabled={isAnalysisMode}
            >
              MTF SYNC: {showHTF ? "ON" : "OFF"}
            </Button>
          </div>

          {activePosition && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 mr-4"
              >
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-bold text-primary/70 leading-none">Position</span>
                    <span className={`text-xs font-bold ${activePosition.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                        {activePosition.direction}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/5" />
                  <Button size="sm" onClick={handleClosePosition} className="h-7 text-[10px] bg-primary hover:bg-primary/90">
                    CLOSE POSTION
                  </Button>
              </motion.div>
          )}
          
          <Button variant="outline" size="sm" className="h-8 gap-2 border-white/10" onClick={() => saveReplayPoint.mutate()}>
            <Save className="w-3.5 h-3.5" />
            Save Progress
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Area */}
        <div className="flex-1 relative bg-black">
          {isAnalysisMode ? (
            <div className="w-full h-full">
              <TradingViewEmbed symbol={session?.symbol || "BTCUSDT"} />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col xl:flex-row gap-px">
              {showHTF && (
                <div className="flex-1 relative border-r border-white/5">
                   <div className="absolute top-4 left-4 z-10">
                     <Badge variant="outline" className="bg-background/80 backdrop-blur-md px-3 border-white/10 uppercase text-[10px] tracking-widest font-black">
                        HTF CONTEXT ({htfTimeframe})
                     </Badge>
                   </div>
                   {isHTFLoading && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                   )}
                   <BacktestChart 
                    data={visibleHtfData} 
                    markers={[]} 
                  />
                </div>
              )}

              <div className="flex-[2] relative">
                {isDataLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0b]/80 backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
                        <p className="text-muted-foreground animate-pulse">Loading market data...</p>
                    </div>
                )}
                
                <BacktestChart 
                  data={visibleData} 
                  markers={markers}
                />

                {/* Toolbar Overlay */}
                <BacktestToolbar 
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  onReset={handleReset}
                  speed={speed}
                  onSpeedChange={setSpeed}
                  candleCount={currentIndex}
                  currentTime={visibleData.length > 0 ? format(new Date(visibleData[visibleData.length-1].time * 1000), "HH:mm:ss") : "00:00:00"}
                  onOpenTrade={handleOpenTrade}
                  onCloseSession={() => setLocation("/backtest")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Side Info Panel */}
        <motion.div 
          initial={{ x: 300 }} animate={{ x: 0 }}
          className="hidden lg:flex flex-col w-72 border-l border-white/5 bg-card/20 backdrop-blur-xl p-4 space-y-4"
        >
           <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Info className="w-4 h-4" />
              Session Info
           </div>
           
           <div className="space-y-3">
               <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{session?.startDate ? format(new Date(session.startDate), "MMM d, yyyy") : "-"}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last Replay</span>
                  <span>{session?.updatedAt ? format(new Date(session.updatedAt), "HH:mm") : "-"}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Symbol</span>
                  <span className="font-bold">{session?.symbol}</span>
               </div>
           </div>

           <div className="pt-4 border-t border-white/5 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-3">
                  <History className="w-4 h-4" />
                  Live Activity
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
                  {markers.slice().reverse().map((m, i) => (
                      <div key={i} className="p-2 rounded-lg bg-background/40 border border-white/5 text-[10px] space-y-1">
                          <div className="flex justify-between font-bold">
                              <span>{m.text.split(' @')[0]}</span>
                              <span className="text-muted-foreground">{format(new Date(m.time * 1000), "HH:mm:ss")}</span>
                          </div>
                          <div className="text-muted-foreground">{m.text}</div>
                      </div>
                  ))}
                  {markers.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-8 italic">No trades yet</p>}
              </div>
           </div>

           {isAnalysisMode && (
             <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
               <p className="text-[10px] text-primary/80 font-medium italic">
                 Use TV Analysis Mode for higher-timeframe context and drawing rules. Switch back to Replay Engine to execute your plan candle-by-candle.
               </p>
             </div>
           )}
        </motion.div>
      </div>
    </div>
  );
}
