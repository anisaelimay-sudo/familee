import { useState } from "react";
import { useListGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@workspace/api-client-react";
import { getListGoalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Target, Trash2, Trophy, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const CAT_ICONS: Record<string, string> = { family: "👨‍👩‍👧‍👦", fitness: "💪", education: "📚", financial: "💰", health: "❤️", fun: "🎉", other: "⭐" };

export function Goals() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: goals = [], isLoading } = useListGoals({});
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", progress: "0", target: "100", unit: "", category: "family", visibleToKids: true });
  const [progressInput, setProgressInput] = useState<Record<number, string>>({});

  const handleCreate = () => {
    if (!form.title.trim() || !form.target) return;
    createGoal.mutate({ data: {
      title: form.title, description: form.description || undefined,
      progress: Number(form.progress), target: Number(form.target),
      unit: form.unit || undefined, category: form.category as any,
      visibleToKids: form.visibleToKids,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", description: "", progress: "0", target: "100", unit: "", category: "family", visibleToKids: true });
        toast({ title: "Goal created!" });
      }
    });
  };

  const handleUpdateProgress = (id: number, current: number) => {
    const val = progressInput[id];
    if (val === undefined) return;
    updateGoal.mutate({ id, data: { progress: Number(val) } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        setEditingId(null);
        setProgressInput(p => { const n = { ...p }; delete n[id]; return n; });
        toast({ title: "Progress updated!" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteGoal.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListGoalsQueryKey() }); toast({ title: "Goal removed" }); }
    });
  };

  const visible = isParent ? goals : goals.filter((g: any) => g.visibleToKids);

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Family Goals</h1>
          <p className="text-muted-foreground">Track what matters most</p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Goal</Button>}
      </header>

      {visible.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No goals yet. Set something to work toward!</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((goal: any) => {
            const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            const isEditing = editingId === goal.id;
            return (
              <Card key={goal.id} className={`transition-all ${goal.achieved ? "border-green-500/50 bg-green-50/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{CAT_ICONS[goal.category] || "⭐"}</span>
                      <div className="min-w-0">
                        <CardTitle className="font-serif text-base truncate">{goal.title}</CardTitle>
                        {goal.description && <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {goal.achieved && <Trophy className="h-5 w-5 text-green-500" />}
                      {!goal.visibleToKids && isParent && <Badge variant="outline" className="text-xs">Private</Badge>}
                      {isParent && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{goal.progress} / {goal.target} {goal.unit}</span>
                      <span className="font-bold text-primary">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                  </div>
                  {isParent && (
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Input
                            type="number"
                            value={progressInput[goal.id] ?? goal.progress}
                            onChange={e => setProgressInput(p => ({ ...p, [goal.id]: e.target.value }))}
                            className="h-8 text-sm"
                            min={0} max={goal.target}
                          />
                          <Button size="sm" className="h-8" onClick={() => handleUpdateProgress(goal.id, goal.progress)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingId(goal.id)}>
                          <Pencil className="h-3 w-3 mr-1" /> Update Progress
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Create Goal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Run a 5K together" autoFocus /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Start</Label><Input type="number" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Target</Label><Input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="miles, $..." /></div>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Visible to kids</Label>
              <Switch checked={form.visibleToKids} onCheckedChange={v => setForm(f => ({ ...f, visibleToKids: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || !form.target || createGoal.isPending}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
