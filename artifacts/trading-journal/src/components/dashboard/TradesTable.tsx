import { formatMoney } from "@/lib/formatters";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  symbol: string;
  netPnl: number;
  entryTime: string;
}

interface TradesTableProps {
  trades: Trade[];
  onTradeClick: (id: string) => void;
}

export default function TradesTable({ trades, onTradeClick }: TradesTableProps) {
  const [activeTab, setActiveTab] = useState<"open" | "recent">("recent");

  return (
    <div className="card-panel overflow-hidden">
      <div className="flex border-b border-border">
        <button 
          onClick={() => setActiveTab("open")}
          className={cn(
            "px-6 py-4 text-sm font-semibold transition-all relative",
            activeTab === "open" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Open Positions
          {activeTab === "open" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-600 to-purple-600 dark:shadow-[0_0_8px_hsl(252_87%_62%/0.5)]" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("recent")}
          className={cn(
            "px-6 py-4 text-sm font-semibold transition-all relative",
            activeTab === "recent" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recent Trades
          {activeTab === "recent" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-600 to-purple-600 dark:shadow-[0_0_8px_hsl(252_87%_62%/0.5)]" />
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 dark:bg-muted/20">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Date</th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Net P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeTab === "recent" ? (
              trades.map((trade) => (
                <tr 
                  key={trade.id} 
                  className="hover:bg-muted/20 dark:hover:bg-primary/[0.03] transition-colors cursor-pointer group"
                  onClick={() => onTradeClick(trade.id)}
                >
                  <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold uppercase group-hover:text-primary transition-colors">{trade.symbol}</td>
                  <td className={cn(
                    "px-6 py-4 text-xs font-bold text-right",
                    trade.netPnl >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {formatMoney(trade.netPnl)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                      <Search className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No open positions found.</p>
                  </div>
                </td>
              </tr>
            )}
            {activeTab === "recent" && trades.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-xs text-muted-foreground">
                  No trades found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
