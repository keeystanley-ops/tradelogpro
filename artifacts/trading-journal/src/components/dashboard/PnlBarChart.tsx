import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { formatMoney } from "@/lib/formatters";

interface PnlBarChartProps {
  data: any[];
}

export default function PnlBarChart({ data }: PnlBarChartProps) {
  return (
    <div className="card-panel p-6 h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          Net Daily P&L
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">i</span>
        </h3>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              hide 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              formatter={(val: number) => [formatMoney(val), "P&L"]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
              {(data || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={(entry?.netPnl ?? 0) >= 0 ? "#059669" : "#DC2626"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
