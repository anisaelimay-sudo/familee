import { useState } from "react";
import { useListMaintenanceItems, useCreateMaintenanceItem, useUpdateMaintenanceItem, useDeleteMaintenanceItem } from "@workspace/api-client-react";
import { getListMaintenanceItemsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wrench, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const CAT_ICONS: Record<string, string> = { hvac: "🌡️", plumbing: "🚰", electrical: "⚡", appliance: "🏠", vehicle: "🚗", exterior: "🏡", pest: "🪲", other: "🔧" };
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming: { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  inprogress: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

export function Maintenance() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: items = [], isLoading } = useListMaintenanceItems({});
  const createItem = useCreateMaintenanceItem();
  const updateItem = useUpdateMaintenanceItem();
  const deleteItem = useDeleteMaintenanceItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [form, setForm] = useState({ title: "", description: "", category: "other", status: "upcoming", scheduledDate: "", cost: "", vendor: "", notes: "" });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createItem.mutate({ data: {
      title: form.title, description: form.description || undefined,
      category: form.category as any, status: form.status as any,
      scheduledDate: form.scheduledDate || undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      vendor: form.vendor || undefined,
      notes: form.notes || undefined,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMaintenanceItemsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", description: "", category: "other", status: "upcoming", scheduledDate: "", cost: "", vendor: "", notes: "" });
        toast({ title: "Maintenance item added!" });
      }
    });
  };

  const handleComplete = (id: number) => {
    updateItem.mutate({ id, data: { status: "completed", completedDate: new Date().toISOString().split("T")[0] } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMaintenanceItemsQueryKey() }); toast({ title: "Marked as complete!" }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMaintenanceItemsQueryKey() }); }
    });
  };

  const filtered = items.filter((i: any) => {
    if (filter === "active") return i.status !== "completed";
    if (filter === "completed") return i.status === "completed";
    return true;
  });

  const overdueCount = items.filter((i: any) => i.status === "overdue").length;

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Home Maintenance</h1>
          <p className="text-muted-foreground">
            Track repairs, appliances, and vehicles
            {overdueCount > 0 && <span className="ml-2 text-destructive font-medium">⚠️ {overdueCount} overdue</span>}
          </p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Task</Button>}
      </header>

      <div className="flex gap-2">
        {(["active", "all", "completed"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">{filter === "active" ? "All maintenance up to date!" : "Nothing here."}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item: any) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.upcoming;
            return (
              <Card key={item.id} className={`border-2 transition-all ${config.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl mt-0.5">{CAT_ICONS[item.category] || "🔧"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
                          {item.scheduledDate && <span>📅 {item.scheduledDate}</span>}
                          {item.vendor && <span>🏢 {item.vendor}</span>}
                          {item.cost !== null && item.cost !== undefined && <span>💰 ${item.cost}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {item.status !== "completed" && isParent && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600" onClick={() => handleComplete(item.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {isParent && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Maintenance Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. HVAC filter change" autoFocus /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_ICONS).map(([k, v]) => <SelectItem key={k} value={k}>{v} {k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Scheduled Date</Label><Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Estimated Cost ($)</Label><Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" /></div>
            </div>
            <div className="space-y-1"><Label>Vendor / Service Provider</Label><Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Jiffy Lube" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createItem.isPending}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
