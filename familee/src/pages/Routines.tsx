import { useState } from "react";
import { useListRoutines, useCreateRoutine, useDeleteRoutine, useListMembers } from "@workspace/api-client-react";
import { getListRoutinesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const TYPE_ICONS: Record<string, string> = { morning: "🌅", bedtime: "🌙", afterschool: "🏠", evening: "🌆", other: "📋" };
const TYPE_COLORS: Record<string, string> = {
  morning: "bg-amber-50 border-amber-200", bedtime: "bg-indigo-50 border-indigo-200",
  afterschool: "bg-green-50 border-green-200", evening: "bg-purple-50 border-purple-200", other: "bg-gray-50 border-gray-200"
};

export function Routines() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: routines = [], isLoading } = useListRoutines({});
  const { data: members = [] } = useListMembers({});
  const createRoutine = useCreateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newStep, setNewStep] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", type: "morning", memberId: "" });

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setSteps(s => [...s, newStep.trim()]);
    setNewStep("");
  };

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createRoutine.mutate({ data: {
      title: form.title,
      type: form.type as any,
      memberId: form.memberId ? Number(form.memberId) : undefined,
      steps: JSON.stringify(steps),
      active: true,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListRoutinesQueryKey() });
        setShowAdd(false);
        setForm({ title: "", type: "morning", memberId: "" });
        setSteps([]);
        toast({ title: "Routine created!" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteRoutine.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListRoutinesQueryKey() }); toast({ title: "Routine removed" }); }
    });
  };

  const parseSteps = (s: string): string[] => {
    try { return JSON.parse(s); } catch { return []; }
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Routines</h1>
          <p className="text-muted-foreground">Daily routines to keep everyone on track</p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Routine</Button>}
      </header>

      {routines.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No routines yet. Add one to get started!</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine: any) => {
            const steps = parseSteps(routine.steps || "[]");
            const isOpen = expanded === routine.id;
            return (
              <Card key={routine.id} className={`border-2 transition-all ${TYPE_COLORS[routine.type] || "bg-gray-50 border-gray-200"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{TYPE_ICONS[routine.type] || "📋"}</span>
                      <div className="min-w-0">
                        <CardTitle className="font-serif text-lg truncate">{routine.title}</CardTitle>
                        {routine.memberName && <p className="text-sm text-muted-foreground">{routine.memberName}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{routine.type}</Badge>
                      {isParent && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(routine.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {steps.length > 0 && (
                  <CardContent className="pt-0">
                    <button className="text-xs text-primary font-medium mb-2" onClick={() => setExpanded(isOpen ? null : routine.id)}>
                      {isOpen ? "Hide steps" : `Show ${steps.length} steps`}
                    </button>
                    {isOpen && (
                      <ol className="space-y-2">
                        {steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-white border flex-shrink-0 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">Create Routine</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Morning Routine" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Member</Label>
                <Select value={form.memberId} onValueChange={v => setForm(f => ({ ...f, memberId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Everyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Everyone</SelectItem>
                    {members.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Steps</Label>
              <div className="flex gap-2">
                <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..." onKeyDown={e => e.key === "Enter" && handleAddStep()} />
                <Button type="button" size="icon" onClick={handleAddStep}><Plus className="h-4 w-4" /></Button>
              </div>
              {steps.length > 0 && (
                <ol className="space-y-1 mt-2">
                  {steps.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                      <span className="flex-1">{s}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSteps(steps.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createRoutine.isPending}>Create Routine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
