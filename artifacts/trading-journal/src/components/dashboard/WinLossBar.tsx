import { formatMoney } from "@/lib/formatters";

interface WinLossBarProps {
  avgWin: number;
  avgLoss: number;
  ratio: number;
}

export default function WinLossBar({ avgWin, avgLoss, ratio }: WinLossBarProps) {
  const total = avgWin + Math.abs(avgLoss);
  const winPct = (avgWin / total) * 100;
  
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-profit" 
          style={{ width: `${winPct}%` }} 
        />
        <div 
          className="h-full bg-loss" 
          style={{ width: `${100 - winPct}%` }} 
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono font-medium">
        <span className="text-profit">{formatMoney(avgWin)}</span>
        <span className="text-loss">{formatMoney(avgLoss)}</span>
      </div>
    </div>
  );
}
