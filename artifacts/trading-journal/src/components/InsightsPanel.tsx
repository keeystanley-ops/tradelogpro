import { useGetInsights } from "@workspace/api-client-react";
import { Clock, User, Brain, AlertTriangle, Activity, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InsightsPanel() {
  const { data, isLoading } = useGetInsights();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-display font-semibold flex items-center gap-2">
          Insights & Alerts
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full animate-pulse w-6 h-5"></span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-panel p-4 rounded-xl h-24 animate-pulse bg-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  const insights = data?.insights || [];
  
  if (insights.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-display font-semibold mb-4">Insights & Alerts</h3>
        <div className="glass-panel p-8 rounded-xl text-center text-muted-foreground border-dashed">
          <Brain className="w-8 h-8 mx-auto mb-3 opacity-50 text-primary" />
          No patterns detected yet. Keep trading and insights will appear here.
        </div>
      </div>
    );
  }

  const displayedInsights = expanded ? insights : insights.slice(0, 6);

  const getIcon = (category: string) => {
    switch (category) {
      case 'TIMING': return <Clock className="w-5 h-5" />;
      case 'PSYCHOLOGY': return <Brain className="w-5 h-5" />;
      case 'RISK': return <AlertTriangle className="w-5 h-5" />;
      case 'CONSISTENCY': return <Activity className="w-5 h-5" />;
      case 'PERFORMANCE': return <TrendingUp className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'DANGER': return 'border-l-loss/80 bg-loss/5';
      case 'WARNING': return 'border-l-yellow-500/80 bg-yellow-500/5';
      case 'TIP': return 'border-l-primary/80 bg-primary/5';
      default: return 'border-l-muted-foreground/50 bg-white/5';
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'DANGER': return 'text-loss';
      case 'WARNING': return 'text-yellow-500';
      case 'TIP': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold flex items-center gap-2">
          Insights & Alerts
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-mono">
            {insights.length}
          </span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedInsights.map(insight => (
          <div 
            key={insight.id} 
            className={`glass-panel p-4 rounded-r-xl rounded-l-sm border-l-4 ${getBorderColor(insight.severity)} hover:bg-white/10 transition-colors flex gap-4`}
          >
            <div className={`mt-0.5 ${getIconColor(insight.severity)}`}>
              {getIcon(insight.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug">{insight.message}</p>
              {insight.detail && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.detail}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {insight.category}
                </span>
                {insight.tradesAffected > 0 && (
                  <span className="text-[10px] bg-background/50 px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground">
                    {insight.tradesAffected} trades
                  </span>
                )}
                {insight.metricValue && (
                  <span className="text-[11px] font-mono ml-auto font-medium">
                    {insight.metricValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {insights.length > 6 && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? (
              <><ChevronUp className="w-4 h-4 mr-1" /> Show Less</>
            ) : (
              <><ChevronDown className="w-4 h-4 mr-1" /> Show All {insights.length} Insights</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
