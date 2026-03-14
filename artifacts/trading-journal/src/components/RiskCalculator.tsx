import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/formatters";
import { Calculator } from "lucide-react";

export default function RiskCalculator({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number | undefined>();
  const [stopLoss, setStopLoss] = useState<number | undefined>();
  const [takeProfit, setTakeProfit] = useState<number | undefined>();

  const { maxRisk, riskPerShare, positionSize, positionValue, rMultiple } = useMemo(() => {
    const maxRisk = accountSize * (riskPct / 100);
    const riskPerShare = (entryPrice !== undefined && stopLoss !== undefined) ? Math.abs(entryPrice - stopLoss) : 0;
    const positionSize = (riskPerShare > 0) ? maxRisk / riskPerShare : 0;
    const positionValue = (entryPrice !== undefined) ? positionSize * entryPrice : 0;
    
    let rMultiple = undefined;
    if (takeProfit !== undefined && entryPrice !== undefined && stopLoss !== undefined && riskPerShare > 0) {
      rMultiple = Math.abs(takeProfit - entryPrice) / riskPerShare;
    }

    return { maxRisk, riskPerShare, positionSize, positionValue, rMultiple };
  }, [accountSize, riskPct, entryPrice, stopLoss, takeProfit]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-l border-border min-w-[400px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl font-display">
            <Calculator className="w-5 h-5 text-primary" /> Risk Calculator
          </SheetTitle>
          <SheetDescription>
            Calculate position sizes based on your risk parameters.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Size ($)</Label>
                <Input 
                  type="number" 
                  value={accountSize || ""} 
                  onChange={(e) => setAccountSize(Number(e.target.value))} 
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Per Trade (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={riskPct || ""} 
                  onChange={(e) => setRiskPct(Number(e.target.value))} 
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entry Price ($)</Label>
              <Input 
                type="number" 
                step="any"
                value={entryPrice || ""} 
                onChange={(e) => setEntryPrice(Number(e.target.value))} 
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss Price ($)</Label>
              <Input 
                type="number" 
                step="any"
                value={stopLoss || ""} 
                onChange={(e) => setStopLoss(Number(e.target.value))} 
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Take Profit Price ($) (Optional)</Label>
              <Input 
                type="number" 
                step="any"
                value={takeProfit || ""} 
                onChange={(e) => setTakeProfit(e.target.value ? Number(e.target.value) : undefined)} 
                className="bg-background"
              />
            </div>
          </div>

          <div className="bg-background/50 p-5 rounded-xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
            
            <h3 className="font-display font-semibold border-b border-border pb-2">Position Sizing</h3>
            
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted-foreground">Max Risk Amount</div>
              <div className="text-right font-mono font-medium text-loss">{formatMoney(maxRisk)}</div>
              
              <div className="text-muted-foreground">Risk Per Share</div>
              <div className="text-right font-mono">{formatMoney(riskPerShare)}</div>
              
              <div className="text-muted-foreground font-semibold text-white">Position Size</div>
              <div className="text-right font-mono font-bold text-lg text-white">
                {Math.floor(positionSize).toLocaleString()} <span className="text-xs text-muted-foreground font-sans font-normal">shares</span>
              </div>
              
              <div className="text-muted-foreground">Total Position Value</div>
              <div className="text-right font-mono">{formatMoney(positionValue)}</div>
              
              {rMultiple !== undefined && (
                <>
                  <div className="text-muted-foreground mt-2 border-t border-white/5 pt-2">Target R-Multiple</div>
                  <div className="text-right font-mono mt-2 border-t border-white/5 pt-2 font-semibold text-profit">
                    {rMultiple.toFixed(2)}R
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 text-sm">
            <h4 className="font-semibold mb-2">R-Multiple Scale</h4>
            <div className="space-y-1 font-mono text-muted-foreground">
              <div className="flex justify-between"><span>1R</span> <span>{formatMoney(maxRisk * 1)}</span></div>
              <div className="flex justify-between"><span>2R</span> <span>{formatMoney(maxRisk * 2)}</span></div>
              <div className="flex justify-between text-profit"><span>3R</span> <span>{formatMoney(maxRisk * 3)}</span></div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
