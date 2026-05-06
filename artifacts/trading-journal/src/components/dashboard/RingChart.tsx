import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface RingChartProps {
  percentage: number;
  label?: string;
  color?: string;
}

export default function RingChart({ percentage, color = "hsl(var(--primary))" }: RingChartProps) {
  const data = [
    { name: "Progress", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

  return (
    <div className="w-12 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={15}
            outerRadius={22}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted)/0.3)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
