import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTrade, getGetTradesQueryKey, getGetDashboardAnalyticsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REQUIRED_FIELDS = ['symbol', 'direction', 'entryTime', 'exitTime', 'entryPrice', 'exitPrice', 'quantity'];
const ALL_FIELDS = [...REQUIRED_FIELDS, 'commissions', 'fees', 'setupTag', 'mistakeTag', 'emotionTag', 'notes'];

export default function CsvImportModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{success: number, error: number, details: string[]}>({ success: 0, error: 0, details: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createTrade = useCreateTrade();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          setCsvHeaders(Object.keys(results.data[0]));
          
          // Auto-map where possible (case-insensitive fuzzy match)
          const autoMap: Record<string, string> = {};
          const headersLC = Object.keys(results.data[0]).map(h => h.toLowerCase());
          
          ALL_FIELDS.forEach(field => {
            const match = headersLC.findIndex(h => h.includes(field.toLowerCase()) || field.toLowerCase().includes(h));
            if (match !== -1) {
              autoMap[field] = Object.keys(results.data[0])[match];
            }
          });
          
          setMapping(autoMap);
          setStep(2);
        } else {
          toast({ title: "Error", description: "CSV file is empty or invalid", variant: "destructive" });
        }
      },
      error: (error) => {
        toast({ title: "Parsing Error", description: error.message, variant: "destructive" });
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ALL_FIELDS.join(',');
    const blob = new Blob([headers + '\nAAPL,LONG,2023-01-01T09:30,2023-01-01T10:30,150.00,155.00,100,1.50,0.50,Breakout,None,Neutral,Great trade'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradelog-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImport = async () => {
    // Validate required mappings
    const missing = REQUIRED_FIELDS.filter(f => !mapping[f]);
    if (missing.length > 0) {
      toast({ title: "Missing Mapping", description: `Please map required fields: ${missing.join(', ')}`, variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    let success = 0;
    let errCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        const payload: any = { assetClass: "STOCK" }; // Default
        
        // Build payload based on mapping
        Object.entries(mapping).forEach(([targetField, csvCol]) => {
          if (csvCol && row[csvCol]) {
            if (['entryPrice', 'exitPrice', 'quantity', 'commissions', 'fees'].includes(targetField)) {
              payload[targetField] = parseFloat(row[csvCol].replace(/[^0-9.-]+/g, ""));
            } else if (targetField === 'direction') {
              payload[targetField] = row[csvCol].toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG';
            } else if (targetField === 'symbol') {
              payload[targetField] = row[csvCol].toUpperCase();
            } else {
              payload[targetField] = row[csvCol];
            }
          }
        });

        // Ensure defaults for numericals
        payload.commissions = payload.commissions || 0;
        payload.fees = payload.fees || 0;

        await createTrade.mutateAsync({ data: payload });
        success++;
      } catch (err: any) {
        errCount++;
        errors.push(`Row ${i+2} (${row[mapping.symbol] || 'Unknown'}): ${err.message || 'Validation failed'}`);
      }
    }

    setResults({ success, error: errCount, details: errors });
    setIsProcessing(false);
    setStep(3);
    
    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: getGetTradesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
    }
  };

  const reset = () => {
    setStep(1);
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
    setResults({success:0, error:0, details:[]});
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) reset();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Import Trades (CSV)</DialogTitle>
          <DialogDescription>
            {step === 1 && "Upload a CSV file containing your trade history."}
            {step === 2 && "Map your CSV columns to TradeLog fields."}
            {step === 3 && "Import Results"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-white/5 transition-colors relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Drag & drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <Button variant="outline" onClick={downloadTemplate}>Download Template</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
                {ALL_FIELDS.map(field => {
                  const isRequired = REQUIRED_FIELDS.includes(field);
                  return (
                    <div key={field} className="grid grid-cols-2 gap-4 items-center p-3 rounded-lg bg-background/50 border border-white/5">
                      <div>
                        <span className="font-medium font-mono text-sm">{field}</span>
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                      </div>
                      <Select 
                        value={mapping[field] || "none"} 
                        onValueChange={(val) => setMapping(prev => ({ ...prev, [field]: val === "none" ? "" : val }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Skip column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Skip (Do not map) --</SelectItem>
                          {csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-border flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={processImport} disabled={isProcessing} className="bg-primary hover:bg-primary/90">
                  {isProcessing ? "Importing..." : "Start Import"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center py-6">
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-profit mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{results.success}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                {results.error > 0 && (
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{results.error}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>

              {results.details.length > 0 && (
                <div className="text-left bg-destructive/10 text-destructive text-sm p-4 rounded-lg max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-4 space-y-1">
                    {results.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}

              <Button onClick={() => onOpenChange(false)} className="w-full">Done</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
