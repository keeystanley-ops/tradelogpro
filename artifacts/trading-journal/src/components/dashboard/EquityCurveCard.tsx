import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/formatters";

interface EquityCurveCardProps {
  data: any[];
}

export default function EquityCurveCard({ data }: EquityCurveCardProps) {
  const isProfit = data && data.length > 0 && (data[data.length - 1]?.cumulativePnl || 0) >= 0;

  return (
    <div className="card-panel p-6 h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          Daily Net Cumulative P&L
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">i</span>
        </h3>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
              {/* Vibrant stroke gradient */}
              <linearGradient id="strokeProfit" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="strokeLoss" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
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
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              formatter={(val: number) => [formatMoney(val), "P&L"]}
            />
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke={isProfit ? "url(#strokeProfit)" : "url(#strokeLoss)"}
              fillOpacity={1}
              fill={isProfit ? "url(#colorPnl)" : "url(#colorLoss)"}
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
