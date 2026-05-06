import { useState } from "react";
import { Responsive as ResponsiveGrid, WidthProvider as WidthProviderHOC, Layout } from "react-grid-layout/legacy";
const Responsive = ResponsiveGrid;
const WidthProvider = WidthProviderHOC;
import { useGetDashboardAnalytics, useGetEquityCurve, useGetTrades, useGetCalendarData } from "@workspace/api-client-react";
import { useGetSettings } from "@/hooks/use-settings";
import { Search, ChevronDown, Calendar as CalendarIcon, Users, Bell, Edit, Plus, GripHorizontal, Settings, Check, LayoutGrid, RotateCcw } from "lucide-react";

import { useDashboardLayout } from "@/hooks/use-dashboard";
import { AddWidgetPanel } from "@/components/dashboard/AddWidgetPanel";
import { WidgetSettingsPanel } from "@/components/dashboard/WidgetSettingsPanel";
import { motion } from "framer-motion";
import { MarketReveal } from "@/components/dashboard/MarketReveal";
import WidgetFrame from "@/components/dashboard/WidgetFrame";
import { renderWidget } from "@/components/dashboard/WidgetRenderer";

import TradeDrawer from "@/components/TradeDrawer";
import CsvImportModal from "@/components/CsvImportModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [displayMode, setDisplayMode] = useState<"$" | "%">("$");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  
  const [isEditing, setIsEditing] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: metrics, isLoading: isMetricsLoading } = useGetDashboardAnalytics();
  const { data: equityData, isLoading: isEquityLoading } = useGetEquityCurve();
  const { data: recentTradesData, isLoading: isTradesLoading } = useGetTrades({ limit: 4 });
  const { data: calendarData, isLoading: isCalendarLoading } = useGetCalendarData({ 
    year: new Date().getFullYear(), month: new Date().getMonth() + 1 
  });
  const { data: settings } = useGetSettings();

  const {
    isReady,
    views,
    activeView,
    activeViewId,
    switchView,
    createView,
    updateActiveView,
    addWidgetToView,
    removeWidgetFromView,
    resetActiveView,
    applyPreset,
  } = useDashboardLayout();

  if (!isReady || isMetricsLoading || isEquityLoading || isTradesLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin dark:shadow-[0_0_20px_hsl(252_87%_62%/0.3)]"></div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  if (!metrics || !equityData) return <div>Failed to load dashboard data.</div>;

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: any) => {
    // Only save when editing so we don't spam localStorage on resize mount
    if (isEditing) {
      updateActiveView({ layouts: allLayouts });
    }
  };

  const handleOpenSettings = (id: string) => {
    setSettingsWidgetId(id);
    setIsSettingsOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      <MarketReveal />
      
      {/* Navbar Style Top Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex justify-between items-center mb-2"
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm cursor-pointer hover:bg-primary/20 transition-colors dark:shadow-[0_0_12px_hsl(252_87%_62%/0.08)]">
                <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary">{activeView?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Dashboard Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {views.map(v => (
                <DropdownMenuItem key={v.id} onClick={() => switchView(v.id)} className="font-semibold text-xs">
                  {v.name}
                  {v.id === activeViewId && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const name = window.prompt("Enter a name for your new view:");
                if (name) createView(name);
              }} className="text-primary font-bold text-xs uppercase tracking-wider">
                <Plus className="w-3.5 h-3.5 mr-2" /> New View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-col items-center justify-center min-w-[32px] min-h-[32px] bg-card border border-border rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all group">
                <span className="text-foreground group-hover:scale-110 group-hover:text-primary transition-all">{displayMode}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              <DropdownMenuLabel className="text-[10px]">Data Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDisplayMode("$")}>Dollars ($)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDisplayMode("%")}>Percentage (%)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                Filters
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Active Filters</h4>
                <div className="text-[10px] text-muted-foreground space-y-2">
                  <div className="flex justify-between border-b border-border pb-1">
                    <span>Account</span>
                    <span className="text-foreground">{selectedAccount}</span>
                  </div>
                </div>
                <p className="text-[10px] italic text-muted-foreground">Click filters below to add...</p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Select Date
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <UICalendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all min-w-[120px]">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {selectedAccount}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px]">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedAccount("All Accounts")}>All Accounts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedAccount("Main Options")}>Main Portfolio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <Popover>
            <PopoverTrigger asChild>
               {/* Notifications */}
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-card border border-border shadow-sm cursor-pointer relative hover:bg-muted/50 hover:border-primary/20 transition-all group">
                <Bell className="w-4 h-4 text-muted-foreground group-hover:rotate-12 group-hover:text-primary transition-all" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full border-2 border-background animate-pulse" />
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold">Alerts</span>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground border border-border">
                No new alerts
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Control Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="flex justify-between items-center bg-card/80 dark:bg-card/50 border border-border p-4 rounded-2xl shadow-sm backdrop-blur-xl dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
      >
        <h2 className="text-lg font-bold">Good morning {settings?.displayName || "Trader"}!</h2>
        <div className="flex items-center gap-3">
          
          {isEditing ? (
             <>
                <button 
                   onClick={resetActiveView}
                   className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-xs font-bold hover:bg-destructive/20 transition-colors"
                 >
                   <RotateCcw className="w-3.5 h-3.5" /> Reset View
                 </button>
               <button 
                   onClick={() => setIsAddWidgetOpen(true)}
                   className="flex items-center gap-2 bg-muted border border-border text-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-muted/70 hover:border-primary/20 transition-all"
                 >
                   <Plus className="w-3.5 h-3.5" /> Add Widget
                 </button>
                 <button 
                   onClick={() => setIsEditing(false)}
                   className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all scale-105"
                 >
                   <Check className="w-3.5 h-3.5" /> Done Editing
                 </button>
             </>
          ) : (
             <>
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-muted/50 hover:border-primary/20 transition-all"
                 >
                   <Edit className="w-3.5 h-3.5" /> Edit Layout
                 </button>
                 <button 
                   onClick={() => setIsImportModalOpen(true)}
                   className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Trade
                </button>
             </>
          )}
        </div>
      </motion.div>

      {/* GRID LAYOUT */}
      {activeView.widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-border dark:border-primary/15 rounded-3xl bg-muted/30 dark:bg-primary/[0.02] mt-8">
           <LayoutGrid className="w-12 h-12 text-muted-foreground/40 mb-4" />
           <h3 className="text-lg font-bold text-foreground">Your dashboard is empty.</h3>
           <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">Customize your perfect trading station. Add charts, metrics, and tables to track your edge.</p>
           <button 
              onClick={() => { setIsEditing(true); setIsAddWidgetOpen(true); }}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
           >
             Start Building
           </button>
        </div>
      ) : (
        <div className="relative mt-4">
          {/* Faint Grid Background when editing */}
          {isEditing && (
             <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(252 87% 62% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(252 87% 62% / 0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          )}
          
          <ResponsiveGridLayout
            className="layout w-full z-10"
            layouts={activeView.layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={40}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditing}
            isResizable={isEditing}
            draggableHandle=".drag-handle"
            margin={[16, 16]}
            useCSSTransforms={true}
          >
            {activeView.widgets.map((widget) => (
              <div key={widget.id} className="relative z-10 group overflow-visible">
                <WidgetFrame 
                  id={widget.id}
                  title={widget.title}
                  isEditing={isEditing}
                  onRemove={removeWidgetFromView}
                  onSettings={handleOpenSettings}
                >
                  {renderWidget(
                    widget.type,
                    metrics,
                    equityData,
                    recentTradesData,
                    calendarData,
                    displayMode,
                    settings,
                    setSelectedTradeId
                  )}
                </WidgetFrame>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Floating Add Widget Button in Edit Mode */}
      {isEditing && activeView.widgets.length > 0 && (
         <button 
           onClick={() => setIsAddWidgetOpen(true)}
            className="fixed bottom-12 right-12 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 animate-bounce rounded-full flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 z-50 transition-all border-none dark:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
         >
           <Plus className="w-6 h-6" />
         </button>
      )}

      {/* Modals & Drawers */}
      <TradeDrawer tradeId={selectedTradeId} onClose={() => setSelectedTradeId(null)} />
      <CsvImportModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} />
      
      <AddWidgetPanel 
         open={isAddWidgetOpen} 
         onOpenChange={setIsAddWidgetOpen} 
         onAdd={(type, defaults) => addWidgetToView({ id: `${type}_${Date.now()}`, type, ...defaults })}
         onApplyPreset={applyPreset}
      />
      
      <WidgetSettingsPanel 
         open={isSettingsOpen}
         onOpenChange={setIsSettingsOpen}
         widgetId={settingsWidgetId}
         currentSettings={{}} // TODO wire this up
         onSave={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}
