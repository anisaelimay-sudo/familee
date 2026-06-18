import { useState } from "react";
import { useListChores, useCreateChore, useUpdateChore, useDeleteChore, useCompleteChore, useListMembers } from "@workspace/api-client-react";
import { getListChoresQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Star, Trash2, CheckSquare, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const PRIORITY_COLORS: Record<string, string> = { high: "destructive", medium: "default", low: "secondary" };

export function Chores() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: chores = [], isLoading } = useListChores({});
  const { data: members = [] } = useListMembers({});
  const createChore = useCreateChore();
  const deleteChore = useDeleteChore();
  const completeChore = useCompleteChore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");

  const [form, setForm] = useState({ title: "", assignedTo: "", priority: "medium", dueDate: "", points: "10", recurring: "" });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createChore.mutate({ data: {
      title: form.title,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
      priority: form.priority as any,
      dueDate: form.dueDate || undefined,
      points: Number(form.points) || 10,
      recurring: form.recurring || undefined,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListChoresQueryKey() });
        setShowAdd(false);
        setForm({ title: "", assignedTo: "", priority: "medium", dueDate: "", points: "10", recurring: "" });
        toast({ title: "Chore added!" });
      }
    });
  };

  const handleToggle = (id: number, completed: boolean) => {
    completeChore.mutate({ id, data: { completed: !completed } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListChoresQueryKey() }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteChore.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListChoresQueryKey() }); toast({ title: "Chore removed" }); }
    });
  };

  const filtered = chores.filter((c: any) => {
    if (filter === "pending") return !c.completed;
    if (filter === "done") return c.completed;
    return true;
  });

  const pendingCount = chores.filter((c: any) => !c.completed).length;
  const doneCount = chores.filter((c: any) => c.completed).length;
  const totalPoints = chores.filter((c: any) => c.completed).reduce((sum: number, c: any) => sum + (c.points || 0), 0);

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-xl" /><div className="h-64 bg-muted rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">{isParent ? "Chore Manager" : "My Chores"}</h1>
          <p className="text-muted-foreground">Keep the household running smoothly</p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Chore</Button>}
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pendingCount, color: "text-primary" },
          { label: "Completed", value: doneCount, color: "text-green-600" },
          { label: "Points Earned", value: totalPoints, color: "text-secondary-foreground" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(["pending", "all", "done"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium text-muted-foreground">{filter === "pending" ? "All caught up! No pending chores." : "Nothing here yet."}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((chore: any) => (
            <Card key={chore.id} className={`transition-all ${chore.completed ? "opacity-60" : ""}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={chore.completed}
                  onCheckedChange={() => handleToggle(chore.id, chore.completed)}
                  className="h-6 w-6"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${chore.completed ? "line-through text-muted-foreground" : ""}`}>{chore.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {chore.assignedName && <span className="text-xs text-muted-foreground">👤 {chore.assignedName}</span>}
                    {chore.dueDate && <span className="text-xs text-muted-foreground">📅 {chore.dueDate}</span>}
                    {chore.recurring && (
                      <span className="flex items-center text-xs text-muted-foreground gap-0.5">
                        <RotateCcw className="h-3 w-3" /> {chore.recurring}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {chore.points > 0 && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-secondary-foreground">
                      <Star className="h-4 w-4 fill-secondary text-secondary" /> {chore.points}
                    </span>
                  )}
                  <Badge variant={PRIORITY_COLORS[chore.priority] as any} className="hidden sm:flex">{chore.priority}</Badge>
                  {isParent && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(chore.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add New Chore</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Wash dishes" autoFocus /></div>
            <div className="space-y-1">
              <Label>Assign to</Label>
              <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anyone</SelectItem>
                  {members.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Points</Label><Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Recurring</Label>
                <Select value={form.recurring} onValueChange={v => setForm(f => ({ ...f, recurring: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createChore.isPending}>Add Chore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
