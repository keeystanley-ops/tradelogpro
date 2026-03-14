import { useState } from "react";
import { useGetPlaybooks, useCreatePlaybook, useUpdatePlaybook, useDeletePlaybook } from "@workspace/api-client-react";
import { getGetPlaybooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatPercent } from "@/lib/formatters";

export default function Playbooks() {
  const { data: playbooks, isLoading } = useGetPlaybooks();
  const deleteMutation = useDeletePlaybook();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<any>(null);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this playbook?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaybooksQueryKey() });
          toast({ title: "Playbook deleted" });
        }
      });
    }
  };

  const openNew = () => {
    setEditingPlaybook(null);
    setIsModalOpen(true);
  };

  const openEdit = (playbook: any) => {
    setEditingPlaybook(playbook);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">My Playbooks</h1>
          <p className="text-muted-foreground mt-1">Define setups, monitor their performance, and trade your edge.</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover-elevate">
          <Plus className="w-4 h-4 mr-2" /> New Playbook
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playbooks?.map(playbook => (
            <div key={playbook.id} className="glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 hover:bg-white/10" onClick={() => openEdit(playbook)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDelete(playbook.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-4 pr-20">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg line-clamp-1">{playbook.name}</h3>
                  <div className="text-xs text-muted-foreground flex gap-2 uppercase tracking-wider font-medium">
                    {playbook.assetClass && <span>{playbook.assetClass}</span>}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">
                {playbook.description || "No description provided."}
              </p>

              {playbook.performance && (
                <div className="grid grid-cols-2 gap-3 mt-auto bg-background/40 p-4 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                    <p className={`font-mono font-bold ${playbook.performance.winRate > 50 ? 'text-profit' : playbook.performance.winRate > 0 ? 'text-loss' : ''}`}>
                      {formatPercent(playbook.performance.winRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
                    <p className={`font-mono font-bold ${playbook.performance.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatMoney(playbook.performance.netPnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trades</p>
                    <p className="font-mono">{playbook.performance.tradeCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg R-Multiple</p>
                    <p className={`font-mono ${playbook.performance.avgRMultiple > 0 ? 'text-profit' : 'text-loss'}`}>
                      {playbook.performance.avgRMultiple ? `${playbook.performance.avgRMultiple.toFixed(2)}R` : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {playbooks?.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-2xl glass-panel">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No playbooks yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">Document your strategies to track their specific performance.</p>
              <Button onClick={openNew} variant="outline">Create Playbook</Button>
            </div>
          )}
        </div>
      )}

      <PlaybookModal open={isModalOpen} onOpenChange={setIsModalOpen} playbook={editingPlaybook} />
    </div>
  );
}

function PlaybookModal({ open, onOpenChange, playbook }: { open: boolean, onOpenChange: (o: boolean) => void, playbook: any }) {
  const createMutation = useCreatePlaybook();
  const updateMutation = useUpdatePlaybook();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, reset } = useForm({
    values: {
      name: playbook?.name || "",
      description: playbook?.description || "",
      assetClass: playbook?.assetClass || "STOCK",
      timeWindow: playbook?.rules?.timeWindow || "",
    }
  });

  const onSubmit = (data: any) => {
    const payload = {
      name: data.name,
      description: data.description,
      assetClass: data.assetClass,
      rules: { timeWindow: data.timeWindow }
    };

    if (playbook) {
      updateMutation.mutate({ id: playbook.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaybooksQueryKey() });
          toast({ title: "Playbook updated" });
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPlaybooksQueryKey() });
          toast({ title: "Playbook created" });
          reset();
          onOpenChange(false);
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{playbook ? "Edit Playbook" : "New Playbook"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. Morning Breakout" required className="bg-background" />
          </div>
          
          <div className="space-y-2">
            <Label>Description & Strategy</Label>
            <Textarea {...register("description")} placeholder="Describe your setup, triggers, and criteria..." className="bg-background min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset Class</Label>
              <Select onValueChange={v => setValue("assetClass", v)} defaultValue={playbook?.assetClass || "STOCK"}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
              <Label>Time Window</Label>
              <Input {...register("timeWindow")} placeholder="e.g. 9:30-11:00 EST" className="bg-background" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isPending ? "Saving..." : playbook ? "Save Changes" : "Create Playbook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
