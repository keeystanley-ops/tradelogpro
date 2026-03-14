import { useQuery } from "@tanstack/react-query";

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

const API = "/api";

function useZellaScore() {
  return useQuery({
    queryKey: ["zella-score"],
    queryFn: () => fetch(`${API}/analytics/zella-score`).then(r => r.json()),
    staleTime: 60_000,
  });
}

const CAT_COLORS: Record<string, string> = {
  profitability: "#10b981",
  consistency: "#6366f1",
  riskManagement: "#f59e0b",
  discipline: "#8b5cf6",
};

const CAT_LABELS: Record<string, string> = {
  profitability: "Profitability",
  consistency: "Consistency",
  riskManagement: "Risk Mgmt",
  discipline: "Discipline",
};

const CAT_MAX: Record<string, number> = {
  profitability: 35,
  consistency: 25,
  riskManagement: 25,
  discipline: 15,
};

export default function ZellaScore() {
  const { data, isLoading } = useZellaScore();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-center h-56">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.overall === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-1">Zella Score</h3>
        <p className="text-sm text-muted-foreground mb-4">Log trades to calculate your score</p>
        <div className="flex items-center justify-center h-32 text-muted-foreground/40">
          <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-30">
            <polygon points="50,10 90,80 10,80" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  }

  const radarData = [
    { axis: "Win Rate", value: data.radarAxes.winRate },
    { axis: "Avg W/L", value: data.radarAxes.avgWinLoss },
    { axis: "Profit Factor", value: data.radarAxes.profitFactor },
  ];

  const categories = data.categories as Record<string, number>;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Zella Score</h3>
          <p className="text-sm text-muted-foreground">Overall performance rating</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-mono" style={{ color: data.color }}>
            {data.overall}
          </div>
          <div className="text-sm font-medium mt-0.5" style={{ color: data.color }}>
            {data.grade} · {data.label}
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ fill: "#6366f1", r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3 mt-2">
        {Object.entries(categories).map(([key, value]) => {
          const max = CAT_MAX[key] || 25;
          const pct = Math.round((value / max) * 100);
          const color = CAT_COLORS[key] || "#6366f1";
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">{CAT_LABELS[key]}</span>
                <span className="text-xs font-mono font-semibold" style={{ color }}>
                  {value}/{max}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
