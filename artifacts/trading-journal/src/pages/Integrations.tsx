import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTradesQueryKey } from "@workspace/api-client-react";
import {
  Link2, CheckCircle2, XCircle, Upload, FileUp, AlertCircle,
  RefreshCw, Clock, Wifi, WifiOff, ChevronRight, X, Eye, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BROKERS = [
  {
    id: "mt4",
    name: "MetaTrader 4 / 5",
    logo: "MT",
    logoColor: "bg-blue-600",
    description: "Connect your MetaTrader account via API",
    status: "coming_soon",
    assetClasses: ["Forex", "CFDs", "Futures"],
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    logo: "IB",
    logoColor: "bg-red-600",
    description: "Sync trades from IBKR TWS or API",
    status: "coming_soon",
    assetClasses: ["Stocks", "Options", "Futures", "Forex"],
  },
  {
    id: "binance",
    name: "Binance",
    logo: "BN",
    logoColor: "bg-yellow-500",
    description: "Import crypto trades from Binance",
    status: "coming_soon",
    assetClasses: ["Crypto", "Futures"],
  },
  {
    id: "td",
    name: "TD Ameritrade / Schwab",
    logo: "TD",
    logoColor: "bg-emerald-600",
    description: "Connect your TD Ameritrade account",
    status: "coming_soon",
    assetClasses: ["Stocks", "Options"],
  },
  {
    id: "webull",
    name: "Webull",
    logo: "WB",
    logoColor: "bg-teal-600",
    description: "Import trades from Webull",
    status: "coming_soon",
    assetClasses: ["Stocks", "Options", "Crypto"],
  },
  {
    id: "csv",
    name: "CSV / Excel Import",
    logo: "CSV",
    logoColor: "bg-primary",
    description: "Upload trade history from any broker",
    status: "available",
    assetClasses: ["All asset classes"],
  },
];

const CSV_TEMPLATES = {
  generic: [
    "symbol", "direction", "entryDate", "exitDate", "entryPrice",
    "exitPrice", "quantity", "netPnl", "commission",
  ],
  ibkr: ["Symbol", "Buy/Sell", "Date/Time", "Quantity", "T. Price", "Comm/Fee", "Realized P/L"],
  mt4: ["Ticket", "Open Time", "Type", "Size", "Symbol", "Price", "S/L", "T/P", "Close Time", "Close Price", "Profit"],
};

type ParsedRow = {
  symbol: string; direction: string; entryDate: string; exitDate: string;
  entryPrice: number; exitPrice: number; quantity: number; netPnl: number; commission: number;
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row: any = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

function mapRow(row: any, template: string): ParsedRow | null {
  try {
    const sym = row.symbol || row.Symbol || row.ticker || "";
    const dir = (row.direction || row["Buy/Sell"] || row.Type || "LONG").toUpperCase();
    const normalized_dir = dir.includes("SELL") || dir.includes("SHORT") ? "SHORT" : "LONG";
    const entryDate = row.entryDate || row["Date/Time"] || row["Open Time"] || row.date || "";
    const exitDate = row.exitDate || row["Close Time"] || row["Exit Date"] || entryDate;
    const entryPrice = parseFloat(row.entryPrice || row.Price || row["Open Price"] || "0");
    const exitPrice = parseFloat(row.exitPrice || row["Close Price"] || row["Exit Price"] || row.Price || "0");
    const qty = parseFloat(row.quantity || row.Quantity || row.Size || row.qty || "1");
    const pnl = parseFloat(row.netPnl || row["Realized P/L"] || row.Profit || row.pnl || "0");
    const comm = parseFloat(row.commission || row["Comm/Fee"] || row.Commission || "0");
    if (!sym) return null;
    return { symbol: sym.toUpperCase(), direction: normalized_dir, entryDate, exitDate, entryPrice, exitPrice, quantity: qty, netPnl: pnl, commission: Math.abs(comm) };
  } catch { return null; }
}

export default function Integrations() {
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvTemplate, setCsvTemplate] = useState("generic");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const rows = parseCSV(text);
      const mapped = rows.map(r => mapRow(r, csvTemplate)).filter(Boolean) as ParsedRow[];
      setParsed(mapped);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/trades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: parsed }),
      });
      const result = await res.json();
      setImportResult({ success: result.imported || 0, failed: result.failed || 0 });
      queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
      toast({ title: `Imported ${result.imported} trades`, description: result.failed ? `${result.failed} rows failed` : "All rows imported successfully" });
    } catch {
      toast({ title: "Import failed", description: "Could not connect to server", variant: "destructive" });
    }
    setImporting(false);
  }

  function downloadTemplate() {
    const header = CSV_TEMPLATES.generic.join(",");
    const example = "AAPL,LONG,2025-01-15 09:30,2025-01-15 10:45,185.00,189.50,100,450.00,2.50";
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "trade_import_template.csv"; a.click();
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your broker accounts or import trade history.</p>
      </div>

      {/* Active connections summary */}
      <div className="glass-panel rounded-xl p-4 border border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">No broker connections</p>
              <p className="text-xs text-muted-foreground">Use CSV import to get started</p>
            </div>
          </div>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => { setCsvOpen(true); setParsed([]); setImportResult(null); }}>
            <Upload className="w-3.5 h-3.5" />Import CSV
          </Button>
        </div>
      </div>

      {/* Broker Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Supported Brokers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BROKERS.map(broker => (
            <div key={broker.id} className="glass-panel rounded-xl border border-border/60 p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${broker.logoColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {broker.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{broker.name}</p>
                  {broker.status === "available"
                    ? <Badge className="text-[10px] h-4 bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Available</Badge>
                    : <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">Coming Soon</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{broker.description}</p>
                <div className="flex flex-wrap gap-1">
                  {broker.assetClasses.map(ac => (
                    <span key={ac} className="text-[10px] bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded">{ac}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                {broker.status === "available"
                  ? <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                      onClick={() => { setCsvOpen(true); setParsed([]); setImportResult(null); }}>
                      <FileUp className="w-3 h-3" />Import
                    </Button>
                  : <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" disabled>
                      Connect <ChevronRight className="w-3 h-3" />
                    </Button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync History placeholder */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Import History</h2>
        <div className="glass-panel rounded-xl border border-border/60 p-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No import history yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Import your first trades using the CSV import above.</p>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={csvOpen} onOpenChange={v => { setCsvOpen(v); if (!v) { setCsvText(""); setParsed([]); setImportResult(null); } }}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />CSV Trade Import
            </DialogTitle>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4">
              {/* Template + Download */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Broker template:</label>
                  <Select value={csvTemplate} onValueChange={v => { setCsvTemplate(v); setParsed([]); }}>
                    <SelectTrigger className="h-8 text-xs flex-1 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Generic (Universal)</SelectItem>
                      <SelectItem value="ibkr">Interactive Brokers</SelectItem>
                      <SelectItem value="mt4">MetaTrader 4/5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 shrink-0" onClick={downloadTemplate}>
                  <Download className="w-3 h-3" />Template
                </Button>
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}>
                <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv and .txt files</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </div>

              {/* Preview */}
              {parsed.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Preview — {parsed.length} rows detected</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="w-3 h-3" />{parsed.length} valid
                    </div>
                  </div>
                  <div className="border border-border rounded-lg overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/20 border-b border-border">
                        <tr>
                          {["Symbol", "Direction", "Entry Date", "Exit Date", "Entry $", "Exit $", "Qty", "P&L", "Comm"].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {parsed.slice(0, 8).map((r, i) => (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="px-3 py-1.5 font-semibold">{r.symbol}</td>
                            <td className="px-3 py-1.5">
                              <span className={`px-1 rounded text-[10px] ${r.direction === "LONG" ? "text-emerald-500" : "text-red-500"}`}>{r.direction}</span>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">{r.entryDate.slice(0, 10)}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{r.exitDate.slice(0, 10)}</td>
                            <td className="px-3 py-1.5 font-mono">${r.entryPrice.toFixed(2)}</td>
                            <td className="px-3 py-1.5 font-mono">${r.exitPrice.toFixed(2)}</td>
                            <td className="px-3 py-1.5">{r.quantity}</td>
                            <td className={`px-3 py-1.5 font-mono font-medium ${r.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {r.netPnl >= 0 ? "+" : ""}${r.netPnl.toFixed(2)}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">${r.commission.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsed.length > 8 && (
                      <p className="text-xs text-center text-muted-foreground py-2">...and {parsed.length - 8} more rows</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => setCsvOpen(false)}>Cancel</Button>
                <Button
                  disabled={parsed.length === 0 || importing}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={handleImport}>
                  {importing
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Importing...</>
                    : <><Upload className="w-3.5 h-3.5" />Import {parsed.length} Trades</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="text-lg font-semibold">Import Complete</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.success} trades imported successfully
                  {importResult.failed > 0 && `, ${importResult.failed} rows skipped`}
                </p>
              </div>
              <Button onClick={() => setCsvOpen(false)} className="bg-primary text-primary-foreground">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
