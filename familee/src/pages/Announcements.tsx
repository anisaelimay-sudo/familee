import { useState } from "react";
import { useListAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Megaphone, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

export function Announcements() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: announcements = [], isLoading } = useListAnnouncements({});
  const createAnn = useCreateAnnouncement();
  const updateAnn = useUpdateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", visibleToKids: true, pinned: false });

  const handleCreate = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    createAnn.mutate({ data: form as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", content: "", visibleToKids: true, pinned: false });
        toast({ title: "Announcement posted!" });
      }
    });
  };

  const handlePin = (id: number, pinned: boolean) => {
    updateAnn.mutate({ id, data: { pinned: !pinned } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteAnn.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); toast({ title: "Removed" }); }
    });
  };

  const visible = isParent
    ? announcements
    : announcements.filter((a: any) => a.visibleToKids);

  const pinned = visible.filter((a: any) => a.pinned);
  const rest = visible.filter((a: any) => !a.pinned);

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Announcements</h1>
          <p className="text-muted-foreground">Family news and updates</p>
        </div>
        {isParent && <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Post</Button>}
      </header>

      {pinned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">📌 Pinned</h2>
          <div className="space-y-3">
            {pinned.map((a: any) => <AnnouncementCard key={a.id} ann={a} isParent={isParent} onPin={handlePin} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      <div>
        {pinned.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent</h2>}
        {rest.length === 0 && pinned.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No announcements yet.</p>
            {isParent && <p className="text-sm text-muted-foreground">Post something to keep the family in the loop!</p>}
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {rest.map((a: any) => <AnnouncementCard key={a.id} ann={a} isParent={isParent} onPin={handlePin} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Subject line..." autoFocus /></div>
            <div className="space-y-1"><Label>Message</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="What would you like to share?" rows={4} /></div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Pin to top</Label>
              <Switch checked={form.pinned} onCheckedChange={v => setForm(f => ({ ...f, pinned: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Visible to kids</Label>
                <p className="text-xs text-muted-foreground">Kids can see this in their dashboard</p>
              </div>
              <Switch checked={form.visibleToKids} onCheckedChange={v => setForm(f => ({ ...f, visibleToKids: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || !form.content.trim() || createAnn.isPending}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementCard({ ann, isParent, onPin, onDelete }: any) {
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <Card className={`transition-all group ${ann.pinned ? "border-secondary/50 bg-secondary/5" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-base">{ann.title}</h3>
              {!ann.visibleToKids && isParent && <Badge variant="outline" className="text-xs">Parents only</Badge>}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{ann.content}</p>
            <p className="text-xs text-muted-foreground mt-2">{timeAgo(ann.createdAt)}</p>
          </div>
          {isParent && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button variant="ghost" size="icon" className={`h-7 w-7 ${ann.pinned ? "text-secondary" : "text-muted-foreground"}`} onClick={() => onPin(ann.id, ann.pinned)}>
                <Pin className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(ann.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
