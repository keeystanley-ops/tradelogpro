import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";

interface ZellaScoreCardProps {
  score: number;
  change?: string;
  radarData: any[];
}

export default function ZellaScoreCard({ score, change = "+1", radarData }: ZellaScoreCardProps) {
  return (
    <div className="card-panel p-6 h-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          Score
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </h3>
      </div>

      <div className="relative w-full flex-1 min-h-0 my-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="80%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="axis" 
              tick={false} 
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Custom Stylized Badges to replace overlapping ticks */}
        <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-3 py-1 text-[9px] font-bold text-muted-foreground shadow-sm">
          Win Rate
        </div>
        <div className="absolute bottom-[20px] left-[5%] bg-card border border-border rounded-full px-3 py-1 text-[9px] font-bold text-muted-foreground shadow-sm">
          Avg W/L
        </div>
        <div className="absolute bottom-[20px] right-[5%] bg-card border border-border rounded-full px-3 py-1 text-[9px] font-bold text-muted-foreground shadow-sm">
          Profit Factor
        </div>
      </div>

      <div className="mt-auto text-center pb-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
          YOUR SCORE:
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-bold text-emerald-500 tracking-tighter">{score}</span>
          <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}
