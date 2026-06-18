import { useState } from "react";
import { useListGroceryItems, useCreateGroceryItem, useUpdateGroceryItem, useDeleteGroceryItem, useListMembers } from "@workspace/api-client-react";
import { getListGroceryItemsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ShoppingCart, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const CATEGORIES = ["produce", "dairy", "meat", "bakery", "pantry", "frozen", "beverages", "household", "personal", "other"];
const CAT_ICONS: Record<string, string> = {
  produce: "🥦", dairy: "🥛", meat: "🥩", bakery: "🍞", pantry: "🥫",
  frozen: "❄️", beverages: "🧃", household: "🏠", personal: "🧴", other: "🛒"
};

export function Groceries() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: items = [], isLoading } = useListGroceryItems({});
  const { data: members = [] } = useListMembers({});
  const createItem = useCreateGroceryItem();
  const updateItem = useUpdateGroceryItem();
  const deleteItem = useDeleteGroceryItem();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", category: "produce", priority: "normal" });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createItem.mutate({ data: {
      name: form.name, quantity: form.quantity || undefined,
      category: form.category as any, priority: form.priority as any,
    } as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListGroceryItemsQueryKey() });
        setShowAdd(false);
        setForm({ name: "", quantity: "", category: "produce", priority: "normal" });
        toast({ title: "Item added!" });
      }
    });
  };

  const handleToggle = (id: number, purchased: boolean) => {
    updateItem.mutate({ id, data: { purchased: !purchased } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListGroceryItemsQueryKey() }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListGroceryItemsQueryKey() }); }
    });
  };

  const clearPurchased = () => {
    const purchased = items.filter((i: any) => i.purchased);
    Promise.all(purchased.map((i: any) => deleteItem.mutateAsync({ id: i.id }))).then(() => {
      qc.invalidateQueries({ queryKey: getListGroceryItemsQueryKey() });
      toast({ title: `Cleared ${purchased.length} purchased items` });
    });
  };

  const byCategory: Record<string, any[]> = {};
  items.filter((i: any) => !i.purchased).forEach((item: any) => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const purchased = items.filter((i: any) => i.purchased);
  const urgentCount = items.filter((i: any) => !i.purchased && i.priority === "urgent").length;
  const totalItems = items.filter((i: any) => !i.purchased).length;

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Grocery List</h1>
          <p className="text-muted-foreground">{totalItems} items remaining{urgentCount > 0 ? ` — ${urgentCount} urgent` : ""}</p>
        </div>
        <div className="flex gap-2">
          {purchased.length > 0 && <Button variant="outline" onClick={clearPurchased}>Clear Purchased</Button>}
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
        </div>
      </header>

      {totalItems === 0 && purchased.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">Grocery list is empty!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{CAT_ICONS[cat] || "🛒"}</span> {cat}
              </h2>
              <div className="space-y-2">
                {catItems.map((item: any) => (
                  <Card key={item.id} className={item.priority === "urgent" ? "border-destructive/40" : ""}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <Checkbox checked={false} onCheckedChange={() => handleToggle(item.id, item.purchased)} className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.name}</p>
                        {item.quantity && <p className="text-xs text-muted-foreground">{item.quantity}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.priority === "urgent" && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                        {item.addedByName && <span className="text-xs text-muted-foreground hidden sm:block">by {item.addedByName}</span>}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {purchased.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">✅ Purchased ({purchased.length})</h2>
              <div className="space-y-2 opacity-60">
                {purchased.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <Checkbox checked={true} onCheckedChange={() => handleToggle(item.id, item.purchased)} className="h-5 w-5" />
                      <p className="flex-1 text-sm line-through text-muted-foreground">{item.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Grocery Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Item Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Whole milk" autoFocus /></div>
            <div className="space-y-1"><Label>Quantity</Label><Input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 1 gallon, 3 lbs..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_ICONS[c]} {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createItem.isPending}>Add to List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
