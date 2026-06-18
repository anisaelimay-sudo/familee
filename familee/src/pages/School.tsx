import { useState } from "react";
import { useListSchoolItems, useCreateSchoolItem, useUpdateSchoolItem, useDeleteSchoolItem, useListMembers } from "@workspace/api-client-react";
import { getListSchoolItemsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, BookOpen, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const TYPE_ICONS: Record<string, string> = { homework: "📝", test: "📊", project: "🔬", assignment: "📋", activity: "🎭", other: "📌" };
const PRIORITY_COLOR: Record<string, string> = { high: "destructive", medium: "default", low: "outline" };

export function School() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: items = [], isLoading } = useListSchoolItems({});
  const { data: members = [] } = useListMembers({});
  const createItem = useCreateSchoolItem();
  const updateItem = useUpdateSchoolItem();
  const deleteItem = useDeleteSchoolItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [filterMember, setFilterMember] = useState<string>("all");
  const [form, setForm] = useState({ title: "", description: "", type: "homework", memberId: "", dueDate: "", subject: "", priority: "medium" });

  const handleCreate = () => {
    if (!form.title.trim() || !form.memberId || !form.dueDate) return;
    createItem.mutate({ data: {
      title: form.title,
      description: form.description || undefined,
      type: form.type as any,
      memberId: Number(form.memberId),
      dueDate: form.dueDate,
      subject: form.subject || undefined,
      priority: form.priority as any,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSchoolItemsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", description: "", type: "homework", memberId: "", dueDate: "", subject: "", priority: "medium" });
        toast({ title: "Added to school hub!" });
      }
    });
  };

  const handleToggle = (id: number, completed: boolean) => {
    updateItem.mutate({ id, data: { completed: !completed } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSchoolItemsQueryKey() }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSchoolItemsQueryKey() }); toast({ title: "Removed" }); }
    });
  };

  const filtered = items.filter((i: any) => filterMember === "all" || String(i.memberId) === filterMember);
  const byMember: Record<string, any[]> = {};
  filtered.forEach((item: any) => {
    const key = item.memberName || `Member ${item.memberId}`;
    if (!byMember[key]) byMember[key] = [];
    byMember[key].push(item);
  });

  const today = new Date().toISOString().split("T")[0]!;
  const isOverdue = (item: any) => !item.completed && item.dueDate < today;
  const isDueSoon = (item: any) => {
    if (item.completed || item.dueDate < today) return false;
    const diff = new Date(item.dueDate).getTime() - Date.now();
    return diff < 2 * 86400000;
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">School Hub</h1>
          <p className="text-muted-foreground">Track homework, tests, and projects</p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Task</Button>}
      </header>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filterMember === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterMember("all")}>All Kids</Button>
        {members.filter((m: any) => m.role === "child").map((m: any) => (
          <Button key={m.id} variant={filterMember === String(m.id) ? "default" : "outline"} size="sm" onClick={() => setFilterMember(String(m.id))}>{m.name}</Button>
        ))}
      </div>

      {Object.keys(byMember).length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No school items yet!</p>
        </CardContent></Card>
      ) : (
        Object.entries(byMember).map(([memberName, memberItems]) => (
          <div key={memberName}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> {memberName}
            </h2>
            <div className="space-y-2">
              {memberItems.sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate)).map((item: any) => (
                <Card key={item.id} className={`transition-all ${item.completed ? "opacity-60" : ""} ${isOverdue(item) ? "border-destructive/50" : isDueSoon(item) ? "border-secondary/70" : ""}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Checkbox checked={item.completed} onCheckedChange={() => handleToggle(item.id, item.completed)} className="h-5 w-5" />
                    <span className="text-lg">{TYPE_ICONS[item.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.subject && <span className="text-xs text-muted-foreground">{item.subject}</span>}
                        <span className={`text-xs font-medium ${isOverdue(item) ? "text-destructive" : isDueSoon(item) ? "text-amber-600" : "text-muted-foreground"}`}>
                          Due {item.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={PRIORITY_COLOR[item.priority] as any} className="hidden sm:flex text-xs">{item.priority}</Badge>
                      <Badge variant="outline" className="hidden sm:flex text-xs">{item.type}</Badge>
                      {isParent && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add School Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Math homework Ch. 5" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Kid</Label>
                <Select value={form.memberId} onValueChange={v => setForm(f => ({ ...f, memberId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{members.filter((m: any) => m.role === "child").map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Math" /></div>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || !form.memberId || !form.dueDate || createItem.isPending}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
