import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  FastForward, 
  RotateCcw, 
  Settings,
  X,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BacktestToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (val: number) => void;
  candleCount: number;
  currentTime: string;
  onOpenTrade: (type: 'LONG' | 'SHORT') => void;
  onCloseSession: () => void;
}

export default function BacktestToolbar({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  speed,
  onSpeedChange,
  candleCount,
  currentTime,
  onOpenTrade,
  onCloseSession
}: BacktestToolbarProps) {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50"
    >
      <TooltipProvider>
        {/* Replay Controls */}
        <div className="flex items-center gap-1 pr-4 border-r border-white/10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5" onClick={onReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Replay</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5" onClick={onPrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous Candle</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                onClick={onTogglePlay}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5" onClick={onNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next Candle</TooltipContent>
          </Tooltip>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-3 px-4 border-r border-white/10 w-48">
          <FastForward className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider 
            value={[speed]} 
            onValueChange={(val) => onSpeedChange(val[0])}
            max={10} 
            min={1} 
            step={1} 
            className="w-full"
          />
          <span className="text-[10px] font-bold text-muted-foreground w-6">{speed}x</span>
        </div>

        {/* Info Badge */}
        <div className="flex items-center gap-4 px-4 border-r border-white/10">
           <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Candles</span>
             <span className="text-sm font-bold">{candleCount}</span>
           </div>
           <div className="flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Market Time</span>
             <span className="text-sm font-bold tabular-nums">{currentTime}</span>
           </div>
        </div>

        {/* Trading Controls */}
        <div className="flex items-center gap-2 pl-4">
          <Button 
            className="bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30 gap-2 h-9 px-4 rounded-xl font-bold"
            onClick={() => onOpenTrade('LONG')}
          >
            <ArrowUpCircle className="w-4 h-4" />
            BUY
          </Button>
          <Button 
            className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 gap-2 h-9 px-4 rounded-xl font-bold"
            onClick={() => onOpenTrade('SHORT')}
          >
            <ArrowDownCircle className="w-4 h-4" />
            SELL
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5 ml-2" onClick={onCloseSession}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}
