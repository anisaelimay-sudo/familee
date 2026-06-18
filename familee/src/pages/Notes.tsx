import { useState } from "react";
import { useListParentNotes, useCreateParentNote, useUpdateParentNote, useDeleteParentNote } from "@workspace/api-client-react";
import { getListParentNotesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, StickyNote, Pin, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const NOTE_COLORS = ["#fef3c7", "#dbeafe", "#fce7f3", "#d1fae5", "#ede9fe", "#fee2e2", "#e0f2fe"];

export function Notes() {
  const { data: notes = [], isLoading } = useListParentNotes({});
  const createNote = useCreateParentNote();
  const updateNote = useUpdateParentNote();
  const deleteNote = useDeleteParentNote();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: "", content: "", pinned: false, color: "#fef3c7" });

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", content: "", pinned: false, color: "#fef3c7" });
    setShowAdd(true);
  };

  const openEdit = (note: any) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content, pinned: note.pinned, color: note.color || "#fef3c7" });
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editing) {
      updateNote.mutate({ id: editing.id, data: form as any }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListParentNotesQueryKey() });
          setShowAdd(false);
          toast({ title: "Note saved!" });
        }
      });
    } else {
      createNote.mutate({ data: form as any }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListParentNotesQueryKey() });
          setShowAdd(false);
          setForm({ title: "", content: "", pinned: false, color: "#fef3c7" });
          toast({ title: "Note created!" });
        }
      });
    }
  };

  const handlePin = (id: number, pinned: boolean) => {
    updateNote.mutate({ id, data: { pinned: !pinned } as any }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListParentNotesQueryKey() }); }
    });
  };

  const handleDelete = (id: number) => {
    deleteNote.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListParentNotesQueryKey() }); toast({ title: "Note deleted" }); }
    });
  };

  const pinned = notes.filter((n: any) => n.pinned);
  const rest = notes.filter((n: any) => !n.pinned);

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Parent Notes</h1>
          <p className="text-muted-foreground">Private notes — only visible to parents</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />New Note</Button>
      </header>

      {notes.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-16 text-center">
          <StickyNote className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No notes yet. Jot something down!</p>
        </CardContent></Card>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">📌 Pinned</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((n: any) => <NoteCard key={n.id} note={n} onEdit={openEdit} onPin={handlePin} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((n: any) => <NoteCard key={n.id} note={n} onEdit={openEdit} onPin={handlePin} onDelete={handleDelete} />)}
          </div>
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title..." autoFocus /></div>
            <div className="space-y-1"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your note..." rows={6} /></div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map(c => (
                  <button key={c} className={`w-7 h-7 rounded-full border-2 ${form.color === c ? "border-primary scale-110" : "border-transparent"} transition-transform`} style={{ backgroundColor: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>{editing ? "Save Changes" : "Create Note"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteCard({ note, onEdit, onPin, onDelete }: { note: any; onEdit: (n: any) => void; onPin: (id: number, p: boolean) => void; onDelete: (id: number) => void }) {
  return (
    <div className="rounded-2xl border-2 p-4 group relative cursor-pointer hover:shadow-md transition-all" style={{ backgroundColor: note.color || "#fef3c7", borderColor: "rgba(0,0,0,0.08)" }} onClick={() => onEdit(note)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button className={`p-1 rounded hover:bg-black/5 ${note.pinned ? "text-amber-700" : "text-gray-500"}`} onClick={() => onPin(note.id, note.pinned)}><Pin className="h-3.5 w-3.5" /></button>
          <button className="p-1 rounded hover:bg-black/5 text-red-500" onClick={() => onDelete(note.id)}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <p className="text-sm text-gray-700 line-clamp-5 whitespace-pre-wrap leading-relaxed">{note.content}</p>
      <p className="text-xs text-gray-500 mt-3">{new Date(note.updatedAt).toLocaleDateString()}</p>
    </div>
  );
}
