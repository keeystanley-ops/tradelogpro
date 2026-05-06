import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Palette, TrendingUp, Bell, Shield, RotateCcw, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useGetSettings, useUpdateSettings, SETTINGS_QUERY_KEY, type UserSettings } from "@/hooks/use-settings";
import { useQueryClient } from "@tanstack/react-query";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "trading", label: "Trading", icon: TrendingUp },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data & Privacy", icon: Shield },
] as const;

type TabId = typeof TABS[number]["id"];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
  "Africa/Nairobi", "Africa/Johannesburg", "Africa/Cairo",
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "KES"];

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: initialSettings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Sync settings state with query data
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const updateField = (field: keyof UserSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    updateSettings.mutate(settings, {
      onSuccess: (updated) => {
        if (updated.theme) setTheme(updated.theme);
        toast({ title: "Settings saved", description: "Your preferences have been updated." });
        setIsSaving(false);
      },
      onError: () => {
        toast({ title: "Failed to save settings", variant: "destructive" });
        setIsSaving(false);
      }
    });
  };

  const resetSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data);
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
      setTheme(data.theme || "dark");
      toast({ title: "Settings reset", description: "All settings reverted to defaults." });
    } catch {
      toast({ title: "Failed to reset settings", variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div className="p-10 text-center text-muted-foreground">Failed to load settings.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetSettings} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={saveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="col-span-3">
          <div className="card-panel p-2 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          <div className="card-panel p-6 space-y-6">
            {activeTab === "profile" && (
              <>
                <div>
                  <h2 className="text-base font-semibold mb-1">Profile Information</h2>
                  <p className="text-xs text-muted-foreground">Update your personal details and trading identity</p>
                </div>
                <div className="flex items-center gap-5 p-4 border border-border rounded-lg bg-muted/20">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(settings.displayName)}&background=6366f1&color=fff&size=64`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{settings.displayName}</p>
                    <p className="text-xs text-muted-foreground">{settings.email || "No email set"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={settings.displayName} onChange={e => updateField("displayName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={settings.email || ""} onChange={e => updateField("email", e.target.value)} placeholder="trader@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.timezone} onValueChange={v => updateField("timezone", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeTab === "trading" && (
              <>
                <div>
                  <h2 className="text-base font-semibold mb-1">Trading Preferences</h2>
                  <p className="text-xs text-muted-foreground">Configure your default trading parameters</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Asset Class</Label>
                    <Select value={settings.defaultAssetClass} onValueChange={v => updateField("defaultAssetClass", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK">Stock</SelectItem>
                        <SelectItem value="CRYPTO">Crypto</SelectItem>
                        <SelectItem value="OPTION">Option</SelectItem>
                        <SelectItem value="FUTURES">Futures</SelectItem>
                        <SelectItem value="FOREX">Forex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value={settings.defaultCurrency} onValueChange={v => updateField("defaultCurrency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Starting Balance ($)</Label>
                    <Input type="number" step="any" value={settings.startingBalance} onChange={e => updateField("startingBalance", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Per Trade (%)</Label>
                    <Input type="number" step="0.01" value={settings.riskPerTrade} onChange={e => updateField("riskPerTrade", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Daily Loss ($)</Label>
                    <Input type="number" step="any" value={settings.maxDailyLoss || ""} onChange={e => updateField("maxDailyLoss", e.target.value || null)} placeholder="No limit" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Daily Trades</Label>
                    <Input type="number" value={settings.maxDailyTrades || ""} onChange={e => updateField("maxDailyTrades", e.target.value ? parseInt(e.target.value) : null)} placeholder="No limit" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "appearance" && (
              <>
                <div>
                  <h2 className="text-base font-semibold mb-1">Appearance</h2>
                  <p className="text-xs text-muted-foreground">Customize how TradeLog looks and feels</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex gap-3">
                      {["dark", "light"].map(t => (
                        <button
                          key={t}
                          onClick={() => { updateField("theme", t); setTheme(t); }}
                          className={cn(
                            "flex-1 p-4 rounded-lg border-2 transition-all text-center capitalize font-medium text-sm",
                            settings.theme === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                          )}
                        >
                          {t === "dark" ? "🌙" : "☀️"} {t} Mode
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">Reduce spacing for more data density</p>
                    </div>
                    <Switch checked={settings.compactMode} onCheckedChange={v => updateField("compactMode", v)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Show P&L in Percentage</p>
                      <p className="text-xs text-muted-foreground">Display P&L as % instead of dollar amounts</p>
                    </div>
                    <Switch checked={settings.showPnlInPercent} onCheckedChange={v => updateField("showPnlInPercent", v)} />
                  </div>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <div>
                  <h2 className="text-base font-semibold mb-1">Notifications</h2>
                  <p className="text-xs text-muted-foreground">Control what alerts and reports you receive</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive important updates via email" },
                    { key: "dailySummary" as const, label: "Daily Summary", desc: "Get a daily recap of your trading performance" },
                    { key: "weeklyReport" as const, label: "Weekly Report", desc: "Receive a weekly performance analysis" },
                    { key: "tradeAlerts" as const, label: "Trade Alerts", desc: "Get notified when risk limits are approached" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={settings[item.key]} onCheckedChange={v => updateField(item.key, v)} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "data" && (
              <>
                <div>
                  <h2 className="text-base font-semibold mb-1">Data & Privacy</h2>
                  <p className="text-xs text-muted-foreground">Manage your data and account</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-sm font-medium mb-1">Export All Data</p>
                    <p className="text-xs text-muted-foreground mb-3">Download all your trades, journal entries, and settings as a JSON file.</p>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Export started", description: "Your data will be ready shortly." })}>
                      Export Data
                    </Button>
                  </div>
                  <div className="p-4 border border-rose-500/30 rounded-lg bg-rose-500/5">
                    <p className="text-sm font-medium text-rose-500 mb-1">Danger Zone</p>
                    <p className="text-xs text-muted-foreground mb-3">Permanently delete all your trade data. This action cannot be undone.</p>
                    <Button variant="destructive" size="sm" onClick={() => toast({ title: "Feature protected", description: "Contact support to delete your account.", variant: "destructive" })}>
                      Delete All Trades
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
