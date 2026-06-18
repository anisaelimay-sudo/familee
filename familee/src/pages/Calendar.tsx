import { useState } from "react";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListEventsQueryKey } from "@workspace/api-client-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CATEGORIES = ["school", "appointment", "birthday", "vacation", "gathering", "sport", "other"];

const CAT_COLORS: Record<string, string> = {
  school: "#6366f1", appointment: "#0ea5e9", birthday: "#ec4899",
  vacation: "#f59e0b", gathering: "#8b5cf6", sport: "#10b981", other: "#94a3b8",
};

export function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: events = [] } = useListEvents({});
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e: any) => e.startDate === dateStr || (e.endDate && e.startDate <= dateStr && e.endDate >= dateStr));
  };

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setSelectedDay(null); };

  const [form, setForm] = useState({ title: "", category: "other", allDay: true, visibleToKids: true, color: "" });

  const handleCreate = () => {
    if (!selectedDateStr || !form.title.trim()) return;
    createEvent.mutate({
      data: {
        title: form.title,
        startDate: selectedDateStr,
        category: form.category,
        allDay: form.allDay,
        visibleToKids: form.visibleToKids,
        color: form.color || CAT_COLORS[form.category] || "#94a3b8",
      } as any
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", category: "other", allDay: true, visibleToKids: true, color: "" });
        toast({ title: "Event added!" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteEvent.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEventsQueryKey() }); toast({ title: "Event removed" }); }
    });
  };

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Family Calendar</h1>
          <p className="text-muted-foreground">Plan and track family events</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
              <CardTitle className="font-serif text-xl">{MONTHS[month]} {year}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const dayEvents = getEventsForDay(day);
                const selected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`min-h-[60px] p-1 rounded-xl border-2 text-left transition-all
                      ${isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/30"}
                      ${selected ? "bg-primary/10 border-primary" : ""}
                    `}
                  >
                    <span className={`text-sm font-medium block mb-1 ${isToday(day) ? "text-primary font-bold" : ""}`}>{day}</span>
                    <div className="space-y-px">
                      {dayEvents.slice(0, 3).map((e: any, i: number) => (
                        <div key={i} className="h-1.5 rounded-full" style={{ backgroundColor: e.color || CAT_COLORS[e.category] || "#94a3b8" }} />
                      ))}
                      {dayEvents.length > 3 && <span className="text-xs text-muted-foreground">+{dayEvents.length - 3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedDay ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif">{MONTHS[month]} {selectedDay}</CardTitle>
                  <Button size="sm" onClick={() => setShowAdd(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-xl">
                    <CalIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No events — click Add to create one</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((e: any) => (
                      <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors group">
                        <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: e.color || CAT_COLORS[e.category] || "#94a3b8" }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{e.title}</p>
                          {e.memberName && <p className="text-xs text-muted-foreground">{e.memberName}</p>}
                          <Badge variant="outline" className="mt-1 text-xs">{e.category}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalIcon className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium text-muted-foreground">Select a day to view or add events</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="font-serif text-base">Upcoming</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events
                  .filter((e: any) => e.startDate >= `${year}-${String(month + 1).padStart(2, "0")}-01`)
                  .slice(0, 5)
                  .map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color || CAT_COLORS[e.category] || "#94a3b8" }} />
                      <span className="flex-1 truncate">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{e.startDate.slice(5)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Add Event — {MONTHS[month]} {selectedDay}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title..." autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>All day</Label>
              <Switch checked={form.allDay} onCheckedChange={v => setForm(f => ({ ...f, allDay: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Visible to kids</Label>
              <Switch checked={form.visibleToKids} onCheckedChange={v => setForm(f => ({ ...f, visibleToKids: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createEvent.isPending}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
