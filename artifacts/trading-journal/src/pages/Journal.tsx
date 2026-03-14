import { useState } from "react";
import { useGetTrades } from "@workspace/api-client-react";
import { formatMoney, formatDateTime } from "@/lib/formatters";
import TradeDrawer from "@/components/TradeDrawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function Journal() {
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [assetClass, setAssetClass] = useState<string>("");

  const { data, isLoading } = useGetTrades({ 
    page, 
    limit: 50, 
    symbol: symbolFilter || undefined,
    assetClass: assetClass && assetClass !== "ALL" ? assetClass : undefined
  });

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Trade Journal</h1>
          <p className="text-muted-foreground">Review and analyze your completed trades.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search symbol..." 
              className="pl-9 bg-card border-border"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
            />
          </div>
          <Select value={assetClass} onValueChange={setAssetClass}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Assets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Assets</SelectItem>
              <SelectItem value="STOCK">Stock</SelectItem>
              <SelectItem value="CRYPTO">Crypto</SelectItem>
              <SelectItem value="OPTION">Option</SelectItem>
              <SelectItem value="FUTURES">Futures</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden border border-white/5">
        <div className="overflow-auto flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-background/80 sticky top-0 z-10 backdrop-blur-md border-b border-border shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Symbol / Type</th>
                  <th className="px-6 py-4 font-medium">Exit Date</th>
                  <th className="px-6 py-4 font-medium">Entry/Exit</th>
                  <th className="px-6 py-4 font-medium">Setup/Tags</th>
                  <th className="px-6 py-4 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data?.trades.map((trade) => {
                  const isProfit = trade.netPnl >= 0;
                  return (
                    <tr 
                      key={trade.id} 
                      onClick={() => setSelectedTradeId(trade.id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isProfit ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                            {isProfit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-display font-bold text-base text-white uppercase">{trade.symbol}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-background text-muted-foreground hover:bg-background h-5 px-1.5 text-[10px] uppercase">{trade.assetClass}</Badge>
                              <Badge className={`${trade.direction === 'LONG' ? 'bg-primary/20 text-primary' : 'bg-purple-500/20 text-purple-400'} border-0 h-5 px-1.5 text-[10px]`}>
                                {trade.direction}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDateTime(trade.exitTime)}
                        <p className="text-xs mt-1 opacity-60">Qty: {trade.quantity}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-[13px]">
                        <div>In: {formatMoney(trade.entryPrice)}</div>
                        <div className="mt-1 opacity-80">Out: {formatMoney(trade.exitPrice)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {trade.setupTag ? <Badge variant="secondary" className="bg-white/5 text-gray-300 font-normal">{trade.setupTag}</Badge> : <span className="text-muted-foreground/50">-</span>}
                          {trade.mistakeTag && <Badge variant="secondary" className="bg-loss/10 text-loss font-normal">{trade.mistakeTag}</Badge>}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold text-base ${isProfit ? 'text-profit' : 'text-loss'}`}>
                        {formatMoney(trade.netPnl)}
                      </td>
                    </tr>
                  )
                })}
                {data?.trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-lg">
                      No trades match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {data && data.total > data.limit && (
          <div className="p-4 border-t border-border bg-background/50 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} trades
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * data.limit >= data.total}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <TradeDrawer tradeId={selectedTradeId} onClose={() => setSelectedTradeId(null)} />
    </div>
  );
}
