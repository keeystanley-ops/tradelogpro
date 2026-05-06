import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function WidgetSettingsPanel({
  open,
  onOpenChange,
  widgetId,
  currentSettings,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetId: string | null;
  currentSettings: any;
  onSave: (id: string, newSettings: any) => void;
}) {
  if (!widgetId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0A0A0B] border-white/10 p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Widget Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label className="text-white/60">Time Range</Label>
            <Select defaultValue={currentSettings?.timeRange || "30D"}>
              <SelectTrigger className="bg-white/[0.03] border-white/5 h-10">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7D">Last 7 Days</SelectItem>
                <SelectItem value="30D">Last 30 Days</SelectItem>
                <SelectItem value="YTD">Year to Date</SelectItem>
                <SelectItem value="ALL">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-white/60">Account Filter</Label>
            <Select defaultValue={currentSettings?.account || "ALL"}>
              <SelectTrigger className="bg-white/[0.03] border-white/5 h-10">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                <SelectItem value="main">Main Portfolio</SelectItem>
                <SelectItem value="crypto">Crypto Trading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <Label className="text-sm font-bold text-white mb-0.5 block">Show In Percentage</Label>
              <span className="text-[10px] text-white/40">Convert dollar values to %</span>
            </div>
            <Switch defaultChecked={currentSettings?.showPercent} />
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            Apply Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
