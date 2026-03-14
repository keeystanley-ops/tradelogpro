import { useState } from "react";
import { useGetCalendarData } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/formatters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // API expects 1-12
  
  const { data, isLoading } = useGetCalendarData({ year, month });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Trading Calendar</h1>
          <p className="text-muted-foreground mt-1">Visualize your daily performance rhythm.</p>
        </div>
        
        {data && (
          <div className="flex items-center gap-6 bg-card px-6 py-3 rounded-2xl border border-border shadow-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly P&L</p>
              <p className={`text-xl font-display font-bold ${data.monthlyNetPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatMoney(data.monthlyNetPnl)}
              </p>
            </div>
            <div className="w-px h-10 bg-border"></div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win</p>
                <p className="text-xl font-display font-bold text-profit">{data.winDays}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Loss</p>
                <p className="text-xl font-display font-bold text-loss">{data.lossDays}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-display font-semibold">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="hover-elevate">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="hover-elevate">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {/* Header Row */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-card/80 py-3 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Grid Cells */}
          {isLoading ? (
            <div className="col-span-7 h-[500px] bg-card flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {blanks.map(b => (
                <div key={`blank-${b}`} className="bg-card/30 min-h-[120px] p-2" />
              ))}
              
              {days.map(dayNum => {
                // Find data for this day
                // Format date string to match API (YYYY-MM-DD)
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayData = data?.days.find(d => d.date.startsWith(dateStr));
                
                const hasTrades = dayData && dayData.tradeCount > 0;
                const isWin = dayData && dayData.netPnl >= 0;
                
                let cellClass = "bg-card hover:bg-white/5 transition-colors relative group min-h-[120px] p-3 flex flex-col";
                if (hasTrades) {
                  cellClass += isWin ? " bg-profit/[0.03]" : " bg-loss/[0.03]";
                }

                return (
                  <div key={dayNum} className={cellClass}>
                    <span className={`text-sm font-medium ${hasTrades ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {dayNum}
                    </span>
                    
                    {hasTrades && (
                      <div className="mt-auto">
                        <p className={`font-mono font-bold text-lg ${isWin ? 'text-profit' : 'text-loss'}`}>
                          {formatMoney(dayData.netPnl)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Indicator bar at bottom */}
                    {hasTrades && (
                      <div className={`absolute bottom-0 left-0 w-full h-1 ${isWin ? 'bg-profit/50' : 'bg-loss/50'}`} />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
