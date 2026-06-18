import { useState } from "react";
import {
  useListExpenses, useCreateExpense, useDeleteExpense,
  useListBudgets, useCreateBudget, useDeleteBudget,
  useListBills, useCreateBill, useUpdateBill, useDeleteBill,
  useListSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal,
} from "@workspace/api-client-react";
import {
  getListExpensesQueryKey, getListBudgetsQueryKey,
  getListBillsQueryKey, getListSavingsGoalsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, DollarSign, TrendingUp, PiggyBank, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const EXPENSE_CATS = ["food", "transport", "utilities", "entertainment", "education", "health", "clothing", "other"];

export function Finances() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: expenses = [] } = useListExpenses({});
  const { data: budgets = [] } = useListBudgets({});
  const { data: bills = [] } = useListBills({});
  const { data: savings = [] } = useListSavingsGoals({});

  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();
  const createSavings = useCreateSavingsGoal();
  const updateSavings = useUpdateSavingsGoal();
  const deleteSavings = useDeleteSavingsGoal();

  const [addExpense, setAddExpense] = useState(false);
  const [addBudget, setAddBudget] = useState(false);
  const [addBill, setAddBill] = useState(false);
  const [addSavings, setAddSavings] = useState(false);

  const [eForm, setEForm] = useState({ description: "", amount: "", category: "food", date: new Date().toISOString().split("T")[0] });
  const [bForm, setBForm] = useState({ name: "", amount: "", category: "food", period: "monthly" });
  const [billForm, setBillForm] = useState({ name: "", amount: "", dueDay: "1", category: "other", autopay: false });
  const [sForm, setSForm] = useState({ name: "", description: "", targetAmount: "", currentAmount: "0", targetDate: "" });

  const totalBudget = budgets.reduce((s: number, b: any) => s + b.amount, 0);
  const totalSpent = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const unpaidBills = bills.filter((b: any) => !b.paid).reduce((s: number, b: any) => s + b.amount, 0);

  const handleCreateExpense = () => {
    if (!eForm.description.trim() || !eForm.amount) return;
    createExpense.mutate({ data: { ...eForm, amount: Number(eForm.amount) } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListExpensesQueryKey() }); setAddExpense(false); setEForm({ description: "", amount: "", category: "food", date: new Date().toISOString().split("T")[0] }); toast({ title: "Expense added!" }); }
    });
  };

  const handleCreateBudget = () => {
    if (!bForm.name.trim() || !bForm.amount) return;
    createBudget.mutate({ data: { ...bForm, amount: Number(bForm.amount) } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() }); setAddBudget(false); setBForm({ name: "", amount: "", category: "food", period: "monthly" }); toast({ title: "Budget created!" }); }
    });
  };

  const handleCreateBill = () => {
    if (!billForm.name.trim() || !billForm.amount) return;
    createBill.mutate({ data: { ...billForm, amount: Number(billForm.amount), dueDay: Number(billForm.dueDay) } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListBillsQueryKey() }); setAddBill(false); setBillForm({ name: "", amount: "", dueDay: "1", category: "other", autopay: false }); toast({ title: "Bill added!" }); }
    });
  };

  const handleCreateSavings = () => {
    if (!sForm.name.trim() || !sForm.targetAmount) return;
    createSavings.mutate({ data: { ...sForm, targetAmount: Number(sForm.targetAmount), currentAmount: Number(sForm.currentAmount) } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() }); setAddSavings(false); setSForm({ name: "", description: "", targetAmount: "", currentAmount: "0", targetDate: "" }); toast({ title: "Savings goal added!" }); }
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-serif font-bold">Family Finances</h1>
        <p className="text-muted-foreground">Budgets, expenses, bills, and savings</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Monthly Budget</p>
            <p className="text-3xl font-bold text-primary mt-1">${totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">Total Spent</p>
            <p className="text-3xl font-bold text-secondary-foreground mt-1">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Upcoming Bills</p>
            <p className="text-3xl font-bold text-red-700 mt-1">${unpaidBills.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses"><Receipt className="h-4 w-4 mr-1.5 hidden sm:inline" />Expenses</TabsTrigger>
          <TabsTrigger value="budgets"><TrendingUp className="h-4 w-4 mr-1.5 hidden sm:inline" />Budgets</TabsTrigger>
          <TabsTrigger value="bills"><DollarSign className="h-4 w-4 mr-1.5 hidden sm:inline" />Bills</TabsTrigger>
          <TabsTrigger value="savings"><PiggyBank className="h-4 w-4 mr-1.5 hidden sm:inline" />Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-semibold">Recent Expenses</h2>
            <Button size="sm" onClick={() => setAddExpense(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 20).map((e: any) => (
              <Card key={e.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">💰</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{e.category} · {e.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">${e.amount.toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteExpense.mutate({ id: e.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListExpensesQueryKey() }) }); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-semibold">Monthly Budgets</h2>
            <Button size="sm" onClick={() => setAddBudget(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <div className="space-y-3">
            {budgets.map((b: any) => {
              const pct = Math.min(100, Math.round((b.spent / b.amount) * 100));
              const over = b.spent > b.amount;
              return (
                <Card key={b.id} className={over ? "border-destructive/40" : ""}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.category} · {b.period}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className={`font-bold text-sm ${over ? "text-destructive" : ""}`}>${b.spent.toFixed(0)} / ${b.amount.toFixed(0)}</p>
                          {over && <p className="text-xs text-destructive">Over budget!</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteBudget.mutate({ id: b.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() }) }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={pct} className={`h-2 ${over ? "[&>*]:bg-destructive" : ""}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-semibold">Monthly Bills</h2>
            <Button size="sm" onClick={() => setAddBill(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <div className="space-y-2">
            {bills.sort((a: any, b: any) => a.dueDay - b.dueDay).map((bill: any) => (
              <Card key={bill.id} className={bill.paid ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bill.paid ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>{bill.dueDay}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{bill.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {bill.autopay && <Badge variant="outline" className="text-xs">Autopay</Badge>}
                      {bill.paid && <Badge variant="outline" className="text-xs text-green-700">Paid</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">${bill.amount.toFixed(2)}</span>
                    <Button size="sm" variant={bill.paid ? "outline" : "default"} className="h-7 text-xs" onClick={() => { updateBill.mutate({ id: bill.id, data: { paid: !bill.paid } as any }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListBillsQueryKey() }) }); }}>
                      {bill.paid ? "Unpaid" : "Mark Paid"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteBill.mutate({ id: bill.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListBillsQueryKey() }) }); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-lg font-semibold">Savings Goals</h2>
            <Button size="sm" onClick={() => setAddSavings(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savings.map((s: any) => {
              const pct = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));
              return (
                <Card key={s.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{s.name}</h3>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                        {s.targetDate && <p className="text-xs text-muted-foreground">By {s.targetDate}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteSavings.mutate({ id: s.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListSavingsGoalsQueryKey() }) }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>${s.currentAmount.toLocaleString()}</span>
                        <span className="font-bold text-primary">{pct}%</span>
                        <span className="text-muted-foreground">${s.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={pct} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={addExpense} onOpenChange={setAddExpense}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Description</Label><Input value={eForm.description} onChange={e => setEForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this for?" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" value={eForm.amount} onChange={e => setEForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={eForm.date} onChange={e => setEForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={eForm.category} onValueChange={v => setEForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpense(false)}>Cancel</Button>
            <Button onClick={handleCreateExpense} disabled={!eForm.description.trim() || !eForm.amount}>Add Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Budget Dialog */}
      <Dialog open={addBudget} onOpenChange={setAddBudget}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Create Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Budget Name</Label><Input value={bForm.name} onChange={e => setBForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Groceries" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" value={bForm.amount} onChange={e => setBForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Period</Label>
                <Select value={bForm.period} onValueChange={v => setBForm(f => ({ ...f, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBudget(false)}>Cancel</Button>
            <Button onClick={handleCreateBudget} disabled={!bForm.name.trim() || !bForm.amount}>Create Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bill Dialog */}
      <Dialog open={addBill} onOpenChange={setAddBill}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Bill</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Bill Name</Label><Input value={billForm.name} onChange={e => setBillForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electric Bill" autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" value={billForm.amount} onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Due Day (1–31)</Label><Input type="number" min={1} max={31} value={billForm.dueDay} onChange={e => setBillForm(f => ({ ...f, dueDay: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Autopay</Label>
              <Switch checked={billForm.autopay} onCheckedChange={v => setBillForm(f => ({ ...f, autopay: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBill(false)}>Cancel</Button>
            <Button onClick={handleCreateBill} disabled={!billForm.name.trim() || !billForm.amount}>Add Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog open={addSavings} onOpenChange={setAddSavings}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">New Savings Goal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Goal Name</Label><Input value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Disney Trip" autoFocus /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Target ($)</Label><Input type="number" value={sForm.targetAmount} onChange={e => setSForm(f => ({ ...f, targetAmount: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Already Saved ($)</Label><Input type="number" value={sForm.currentAmount} onChange={e => setSForm(f => ({ ...f, currentAmount: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Target Date</Label><Input type="date" value={sForm.targetDate} onChange={e => setSForm(f => ({ ...f, targetDate: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSavings(false)}>Cancel</Button>
            <Button onClick={handleCreateSavings} disabled={!sForm.name.trim() || !sForm.targetAmount}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
