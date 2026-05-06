import { formatMoney } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useGetCalendarData } from "@workspace/api-client-react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardCalendarProps {
  data?: { date: string; netPnl: number; tradeCount: number }[];
  monthName?: string;
  onTradeClick: (id: number) => void;
}

export default function DashboardCalendar({ onTradeClick }: DashboardCalendarProps) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const { data: calendarData } = useGetCalendarData({ year, month: month + 1 });
  const days = calendarData?.days || [];
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build a lookup map for fast access
  const dataMap = new Map<string, { netPnl: number; tradeCount: number }>();
  for (const d of days) {
    dataMap.set(d.date, { netPnl: d.netPnl, tradeCount: d.tradeCount });
  }

  // Weekly P&L summaries
  const weeks: { pnl: number; trades: number }[] = [];
  let weekPnl = 0;
  let weekTrades = 0;
  let cellCount = 0;

  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDayOfMonth + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayData = dataMap.get(dateStr);
      if (dayData) {
        weekPnl += dayData.netPnl;
        weekTrades += dayData.tradeCount;
      }
    }
    cellCount++;
    if (cellCount % 7 === 0) {
      weeks.push({ pnl: weekPnl, trades: weekTrades });
      weekPnl = 0;
      weekTrades = 0;
    }
  }

  const totalRows = Math.ceil((firstDayOfMonth + daysInMonth) / 7);

  return (
    <div className="card-panel p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">{monthName}</h3>
        <div className="flex gap-1">
           <button 
             onClick={prevMonth}
             className="text-muted-foreground w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button 
             onClick={nextMonth}
             className="text-muted-foreground w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors"
           >
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
      
      <div className="grid grid-cols-[repeat(7,1fr)_110px] border-t border-l border-border rounded-lg overflow-hidden">
        {/* Day headers */}
        {dayHeaders.map(day => (
          <div key={day} className="border-r border-b border-border bg-muted/30 py-2 text-center text-[10px] font-bold text-muted-foreground uppercase">
            {day}
          </div>
        ))}
        <div className="border-r border-b border-border bg-muted/30 py-2 text-center text-[10px] font-bold text-muted-foreground uppercase">
          Weekly
        </div>
        
        {/* Calendar grid */}
        {Array.from({ length: totalRows * 7 }).map((_, i) => {
          const dayNum = i - firstDayOfMonth + 1;
          const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
          const row = Math.floor(i / 7);
          
          const dateStr = isValidDay
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            : '';
          const dayData = isValidDay ? dataMap.get(dateStr) : undefined;
          
          const isToday = isValidDay && 
            dayNum === now.getDate() && 
            month === now.getMonth() && 
            year === now.getFullYear();
          
          const showWeekly = (i + 1) % 7 === 0;
          const weekData = weeks[row];

          return (
            <>
              <div 
                key={`day-${i}`} 
                className={cn(
                  "border-r border-b border-border min-h-[72px] p-1.5 relative transition-colors",
                  dayData ? "cursor-pointer hover:bg-muted/30" : "",
                  !isValidDay ? "bg-muted/5" : "bg-card",
                  isToday ? "ring-1 ring-inset ring-primary/40" : ""
                )}
                onClick={() => {
                  if (dayData) onTradeClick(1);
                }}
              >
                {isValidDay && (
                  <span className={cn(
                    "text-[10px] absolute top-1.5 right-2",
                    isToday 
                      ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-bold" 
                      : "text-muted-foreground"
                  )}>
                    {dayNum}
                  </span>
                )}
                {dayData && (
                  <div className={cn(
                    "mt-5 rounded px-1.5 py-1 text-center border",
                    dayData.netPnl >= 0 
                      ? "bg-emerald-500/10 border-emerald-500/20" 
                      : "bg-rose-500/10 border-rose-500/20"
                  )}>
                    <div className={cn(
                      "text-[11px] font-bold",
                      dayData.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {Math.abs(dayData.netPnl) >= 1000 
                        ? `$${(dayData.netPnl / 1000).toFixed(1)}K` 
                        : formatMoney(dayData.netPnl)}
                    </div>
                    <div className={cn(
                      "text-[8px] opacity-80",
                      dayData.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
              {showWeekly && (
                <div 
                  key={`week-${row}`}
                  className="border-r border-b border-border min-h-[72px] p-2 bg-muted/10 flex flex-col justify-center items-center"
                >
                  <div className="text-[9px] text-muted-foreground mb-0.5">Week {row + 1}</div>
                  <div className={cn(
                    "text-xs font-bold",
                    weekData && weekData.pnl > 0 ? "text-emerald-500" : weekData && weekData.pnl < 0 ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {weekData ? formatMoney(weekData.pnl) : "$0.00"}
                  </div>
                  <div className="text-[8px] text-muted-foreground">
                    {weekData?.trades || 0} trades
                  </div>
                </div>
              )}
            </>
          );
        })}
      </div>

      {/* Monthly summary bar */}
      <div className="mt-4 flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2.5 border border-border">
        <div className="text-xs text-muted-foreground">
          Monthly P&L
        </div>
        <div className={cn(
          "text-sm font-bold",
          (calendarData?.monthlyNetPnl ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500"
        )}>
          {formatMoney(calendarData?.monthlyNetPnl ?? 0)}
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="text-emerald-500 font-semibold">{calendarData?.winDays ?? 0} win days</span>
          <span className="text-rose-500 font-semibold">{calendarData?.lossDays ?? 0} loss days</span>
        </div>
      </div>
    </div>
  );
}
