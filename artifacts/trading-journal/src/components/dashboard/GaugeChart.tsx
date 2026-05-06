import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeChartProps {
  value: number;
  max?: number;
}

export default function GaugeChart({ value, max = 3 }: GaugeChartProps) {
  // Profit factor gauge usually ranges from 0 to 3+
  const normalizedValue = Math.min(value, max);
  const percentage = (normalizedValue / max) * 100;
  
  const data = [
    { name: "Value", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  const getColor = (v: number) => {
    if (v < 1) return "#ef4444"; // Loss
    if (v < 2) return "#f59e0b"; // Soso
    return "#10b981"; // Good
  };

  return (
    <div className="w-20 h-10 relative overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={25}
            outerRadius={35}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={getColor(value)} />
            <Cell fill="hsl(var(--muted)/0.3)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
