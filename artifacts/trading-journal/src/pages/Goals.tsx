import { useState } from "react";
import { useGetGoals, useCreateGoal, useDeleteGoal } from "@workspace/api-client-react";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { Target, Plus, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { getGetGoalsQueryKey } from "@workspace/api-client-react";

export default function Goals() {
  const { data: goals, isLoading } = useGetGoals();
  const deleteMutation = useDeleteGoal();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (confirm("Delete this goal?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold">Goals & Objectives</h1>
          <p className="text-muted-foreground mt-1">Set targets and track your progress automatically.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground hover-elevate">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals?.map(goal => (
            <div key={goal.id} className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              {goal.isCompleted && <div className="absolute top-0 right-0 w-32 h-32 bg-profit/20 blur-[50px] rounded-full" />}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${goal.isCompleted ? 'bg-profit/20 text-profit' : 'bg-primary/20 text-primary'}`}>
                    {goal.isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{goal.period}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(goal.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="text-3xl font-display font-bold">
                    {goal.type === 'PNL' || goal.type === 'MAX_LOSS' ? formatMoney(goal.currentValue) : 
                     goal.type === 'WIN_RATE' ? formatPercent(goal.currentValue) : 
                     goal.currentValue}
                  </div>
                  <div className="text-sm text-muted-foreground pb-1">
                    / {goal.type === 'PNL' || goal.type === 'MAX_LOSS' ? formatMoney(goal.targetValue) : 
                       goal.type === 'WIN_RATE' ? formatPercent(goal.targetValue) : 
                       goal.targetValue}
                  </div>
                </div>

                <div className="relative w-full h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${goal.isCompleted ? 'bg-profit' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, goal.progressPct)}%` }}
                  />
                </div>
                
                <p className="text-xs text-right text-muted-foreground">
                  {Math.round(goal.progressPct)}% Complete
                </p>
              </div>
            </div>
          ))}
          {goals?.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-border rounded-2xl">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No goals set</h3>
              <p className="text-muted-foreground mt-1">Create your first goal to start tracking progress.</p>
            </div>
          )}
        </div>
      )}

      <AddGoalModal open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

function AddGoalModal({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const createMutation = useCreateGoal();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: { type: "PNL", period: "MONTHLY" }
  });

  const onSubmit = (data: any) => {
    // API expects full CreateGoalRequest
    const payload = {
      ...data,
      targetValue: parseFloat(data.targetValue),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days default for demo
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() });
        reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Goal Name</Label>
            <Input {...register("name")} placeholder="e.g. Q3 Profit Target" required className="bg-background" />
          </div>
          
          <div className="space-y-2">
            <Label>Metric Type</Label>
            <Select onValueChange={v => setValue("type", v)} defaultValue="PNL">
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PNL">Net Profit</SelectItem>
                <SelectItem value="WIN_RATE">Win Rate (%)</SelectItem>
                <SelectItem value="PROFIT_FACTOR">Profit Factor</SelectItem>
                <SelectItem value="TRADE_COUNT">Number of Trades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Value</Label>
            <Input type="number" step="any" {...register("targetValue")} placeholder="10000" required className="bg-background" />
          </div>

          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select onValueChange={v => setValue("period", v)} defaultValue="MONTHLY">
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {createMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
