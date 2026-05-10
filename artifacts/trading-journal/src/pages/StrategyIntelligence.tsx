import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Settings, 
  Plus, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  Zap,
  Target,
  FlaskConical,
  Eye,
  Trash2,
  Edit2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function StrategyIntelligence() {
  const [isAdding, setIsAdding] = useState(false);
  const [rawContent, setRawContent] = useState("");
  const [strategyName, setStrategyName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const handleSaveStrategy = async () => {
    if (!rawContent.trim()) return;
    setIsParsing(true);
    try {
      const response = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: strategyName,
          content: rawContent,
          type: "MANUAL"
        }),
      });

      if (!response.ok) throw new Error("Failed to parse");

      toast({
        title: "Strategy Synchronized",
        description: "AI has successfully parsed and structured your strategy rules.",
      });
      setIsAdding(false);
      setRawContent("");
      setStrategyName("");
    } catch (err) {
      toast({
        title: "Synchronization Error",
        description: "Failed to connect to AI Strategy Engine.",
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Strategy Intelligence <span className="text-primary"><Brain className="w-8 h-8" /></span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">
            A centralized AI command center for your trading rules. The AI understands, converts, and audit your strategy in real-time.
          </p>
        </div>
        {!isAdding && (
          <Button 
            className="rounded-2xl h-14 px-8 font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            SYNCHRONIZE NEW RULES
          </Button>
        )}
      </section>

      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Input Panel */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[32px] overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Raw Strategy Input
              </CardTitle>
              <CardDescription className="text-sm">
                Paste your rules, playbooks, or trading plan. The AI will extract entry, exit, and risk logic automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <Input 
                  placeholder="Strategy Name (e.g., SMC Reversal, London Open)"
                  className="rounded-xl h-12 bg-background/50 border-border"
                  value={strategyName}
                  onChange={e => setStrategyName(e.target.value)}
                />
                <Textarea 
                  placeholder="Paste your rules here... Example: 'Only take longs at London Open after a liquidity sweep of Asia range 15m MSS confirmation...'"
                  className="min-h-[400px] rounded-2xl p-6 bg-background/50 border-border font-mono text-sm leading-relaxed"
                  value={rawContent}
                  onChange={e => setRawContent(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  className="flex-1 rounded-xl h-12 font-bold bg-primary text-white"
                  onClick={handleSaveStrategy}
                  disabled={isParsing || !rawContent.trim()}
                >
                  {isParsing ? "PARSING RULES..." : "EXECUTE AI PARSING"}
                </Button>
                <Button 
                  variant="ghost" 
                  className="rounded-xl h-12 font-bold px-6"
                  onClick={() => setIsAdding(false)}
                >
                  CANCEL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Intelligence Panel */}
          <Card className="border-primary/20 bg-primary/[0.03] backdrop-blur-md rounded-[32px] flex flex-col justify-center items-center text-center p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <Sparkles className="w-12 h-12 text-primary/20" />
            </div>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
              <Zap className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black mb-4">AI Rule Interpretation</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">
              Once you execute parsing, our **Strategy Intelligence Engine** will convert your text into structured logic used for real-time trade auditing.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              {[
                { icon: Target, label: "Entry Models" },
                { icon: ShieldCheck, label: "Risk Params" },
                { icon: AlertCircle, label: "Invalidation" },
                { icon: FlaskConical, label: "Exit Management" }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card border border-border/50 flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="rounded-[24px] border-dashed border-2 border-border/50 bg-transparent flex flex-col items-center justify-center p-10 group hover:border-primary/50 transition-all cursor-pointer" onClick={() => setIsAdding(true)}>
             <Plus className="w-8 h-8 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
             <p className="font-bold text-muted-foreground group-hover:text-foreground">Upload Manual Strategy</p>
          </Card>
        </section>
      )}

      {/* Strategy Audit Timeline */}
      <section className="space-y-6 pt-12">
        <h2 className="text-2xl font-black flex items-center gap-3">
          Strategy Performance Audit <span className="text-muted-foreground/30"><FlaskConical className="w-6 h-6" /></span>
        </h2>
        <div className="p-20 rounded-[40px] border border-border/50 bg-card/20 flex flex-col items-center justify-center text-center">
          <div className="p-6 rounded-3xl bg-muted/30 mb-6">
            <Eye className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No strategy execution data found for active rules.</p>
          <p className="text-xs text-muted-foreground/40 mt-2">Active rules will automatically trigger audit analysis on new trades.</p>
        </div>
      </section>
    </div>
  );
}
