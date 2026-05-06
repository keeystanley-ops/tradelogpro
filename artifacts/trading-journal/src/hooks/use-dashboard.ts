import { useState, useEffect } from "react";
import { Layout } from "react-grid-layout";

export interface WidgetConfig {
  id: string;
  type: string;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  title: string;
  settings?: any;
}

export interface DashboardView {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layouts: { [key: string]: Layout[] };
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "netPnl", type: "NetPnl", w: 2, h: 3, title: "Net P&L" },
  { id: "expectancy", type: "TradeExpectancy", w: 2, h: 3, title: "Trade Expectancy" },
  { id: "profitFactor", type: "ProfitFactor", w: 2, h: 3, title: "Profit Factor" },
  { id: "winRate", type: "WinRate", w: 3, h: 3, title: "Win %" },
  { id: "avgWinLoss", type: "AvgWinLoss", w: 3, h: 3, title: "Avg Win/Loss" },
  { id: "zellaScore", type: "ZellaScore", w: 4, h: 6, minW: 3, minH: 4, title: "Trading Score" },
  { id: "equityCurve", type: "EquityCurve", w: 4, h: 6, minW: 3, minH: 4, title: "Equity Curve" },
  { id: "pnlBar", type: "PnlChart", w: 4, h: 6, minW: 3, minH: 4, title: "P&L Chart" },
  { id: "tradesTable", type: "TradesTable", w: 6, h: 8, minW: 4, minH: 5, title: "Recent Trades" },
  { id: "calendar", type: "Calendar", w: 6, h: 8, minW: 4, minH: 5, title: "Performance Calendar" },
  { id: "currentStreak", type: "CurrentStreak", w: 2, h: 2, title: "Current Streak" },
  { id: "accountBalance", type: "AccountBalance", w: 2, h: 2, title: "Account Balance" },
];

const DEFAULT_LAYOUTS: { [key: string]: Layout[] } = {
  lg: [
    { i: "netPnl", x: 0, y: 0, w: 2, h: 3 },
    { i: "expectancy", x: 2, y: 0, w: 2, h: 3 },
    { i: "profitFactor", x: 4, y: 0, w: 2, h: 3 },
    { i: "winRate", x: 6, y: 0, w: 3, h: 3 },
    { i: "avgWinLoss", x: 9, y: 0, w: 3, h: 3 },
    { i: "zellaScore", x: 0, y: 3, w: 4, h: 6 },
    { i: "equityCurve", x: 4, y: 3, w: 4, h: 6 },
    { i: "pnlBar", x: 8, y: 3, w: 4, h: 6 },
    { i: "tradesTable", x: 0, y: 9, w: 6, h: 8 },
    { i: "calendar", x: 6, y: 9, w: 6, h: 8 },
    { i: "currentStreak", x: 6, y: 0, w: 2, h: 3 },
    { i: "accountBalance", x: 8, y: 0, w: 2, h: 3 },
  ]
};

const DEFAULT_VIEW: DashboardView = {
  id: "default",
  name: "Main Dashboard",
  widgets: DEFAULT_WIDGETS,
  layouts: DEFAULT_LAYOUTS,
};

export function useDashboardLayout() {
  const [views, setViews] = useState<DashboardView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>("default");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_views");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setViews(parsed);
          const lastActive = localStorage.getItem("dashboard_active_view");
          if (lastActive && parsed.some(v => v.id === lastActive)) {
            setActiveViewId(lastActive);
          } else {
            setActiveViewId(parsed[0].id);
          }
        } else {
          setViews([DEFAULT_VIEW]);
        }
      } catch {
        setViews([DEFAULT_VIEW]);
      }
    } else {
      setViews([DEFAULT_VIEW]);
    }
    setIsReady(true);
  }, []);

  const saveViews = (newViews: DashboardView[]) => {
    setViews(newViews);
    localStorage.setItem("dashboard_views", JSON.stringify(newViews));
  };

  const activeView = views.find(v => v.id === activeViewId) || DEFAULT_VIEW;

  const updateActiveView = (update: Partial<DashboardView>) => {
    const newViews = views.map(v => v.id === activeViewId ? { ...v, ...update } : v);
    saveViews(newViews);
  };

  const addWidgetToView = (widget: WidgetConfig) => {
    const currentLayouts = activeView.layouts?.lg || [];
    
    // Find empty slot (simplistic approach: append at bottom)
    let maxY = 0;
    currentLayouts.forEach(l => {
      if (l.y + l.h > maxY) maxY = l.y + l.h;
    });

    const newLayoutItem: Layout = {
      i: widget.id,
      x: 0,
      y: maxY,
      w: widget.w,
      h: widget.h,
      minW: widget.minW,
      minH: widget.minH,
    };

    updateActiveView({
      widgets: [...activeView.widgets, widget],
      layouts: {
        ...activeView.layouts,
        lg: [...currentLayouts, newLayoutItem],
      }
    });
  };

  const removeWidgetFromView = (widgetId: string) => {
    updateActiveView({
      widgets: activeView.widgets.filter(w => w.id !== widgetId),
      layouts: {
        ...activeView.layouts,
        lg: activeView.layouts.lg.filter(l => l.i !== widgetId),
        md: activeView.layouts.md?.filter(l => l.i !== widgetId),
        sm: activeView.layouts.sm?.filter(l => l.i !== widgetId),
      }
    });
  };

  const updateWidgetSettings = (widgetId: string, settings: any) => {
    updateActiveView({
      widgets: activeView.widgets.map(w => w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w)
    });
  };

  const switchView = (id: string) => {
    setActiveViewId(id);
    localStorage.setItem("dashboard_active_view", id);
  };

  const createView = (name: string) => {
    const newView: DashboardView = {
      id: "view_" + Date.now(),
      name,
      widgets: [],
      layouts: { lg: [] }
    };
    saveViews([...views, newView]);
    switchView(newView.id);
  };

  const resetActiveView = () => {
    updateActiveView({
      widgets: DEFAULT_WIDGETS,
      layouts: DEFAULT_LAYOUTS
    });
  };

  const applyPreset = (preset: { widgets: WidgetConfig[]; layouts: { [key: string]: Layout[] } }) => {
    updateActiveView({
      widgets: preset.widgets,
      layouts: preset.layouts,
    });
  };

  return {
    isReady,
    views,
    activeView,
    activeViewId,
    switchView,
    createView,
    updateActiveView,
    addWidgetToView,
    removeWidgetFromView,
    updateWidgetSettings,
    resetActiveView,
    applyPreset,
  };
}
