import { useState } from "react";
import { useListMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@workspace/api-client-react";
import { getListMembersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "@/context/AppContext";

const AVATAR_FACES = ["round", "oval", "square", "heart"];
const AVATAR_HAIRS = ["short", "wavy", "long", "spiky", "pigtails", "bun", "none"];
const AVATAR_CLOTHING = ["shirt", "tshirt", "dress", "hoodie", "casual"];
const AVATAR_ACCESSORIES = ["none", "glasses", "bow", "cap", "headband"];
const SKIN_TONES = ["#FFDBAC", "#F1C27D", "#E0AC69", "#C68642", "#8D5524", "#FFDAB9"];
const HAIR_COLORS = ["#1a1a1a", "#8B4513", "#FFD700", "#FF6B9D", "#FF4500", "#4169E1", "#808080"];
const MEMBER_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#f97316"];

function AvatarSVG({ config, size = 80 }: { config: any; size?: number }) {
  const skin = config.skin || "#FFDBAC";
  const hair = config.hairColor || "#8B4513";
  const face = config.face || "round";

  const faceRx = face === "round" ? 35 : face === "oval" ? 28 : face === "square" ? 28 : 28;
  const faceRy = face === "oval" ? 38 : face === "heart" ? 30 : 35;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="40" cy="70" rx="22" ry="14" fill={config.clothing === "dress" ? "#a78bfa" : "#6366f1"} />
      {/* Head */}
      <ellipse cx="40" cy="38" rx={faceRx} ry={faceRy} fill={skin} />
      {/* Hair */}
      {config.hair !== "none" && (
        config.hair === "long" ? (
          <>
            <ellipse cx="40" cy="20" rx="28" ry="14" fill={hair} />
            <rect x="12" y="20" width="8" height="28" rx="4" fill={hair} />
            <rect x="60" y="20" width="8" height="28" rx="4" fill={hair} />
          </>
        ) : config.hair === "wavy" ? (
          <path d="M14 20 Q20 10 28 18 Q35 8 40 16 Q47 8 54 18 Q62 10 66 20" stroke={hair} strokeWidth="8" fill="none" strokeLinecap="round" />
        ) : config.hair === "pigtails" ? (
          <>
            <ellipse cx="40" cy="20" rx="22" ry="10" fill={hair} />
            <ellipse cx="13" cy="30" rx="8" ry="5" fill={hair} transform="rotate(-20 13 30)" />
            <ellipse cx="67" cy="30" rx="8" ry="5" fill={hair} transform="rotate(20 67 30)" />
          </>
        ) : config.hair === "spiky" ? (
          <>
            <polygon points="40,4 30,18 28,8 22,20 18,10 18,24 40,22 62,24 62,10 58,20 52,8 50,18" fill={hair} />
          </>
        ) : config.hair === "bun" ? (
          <>
            <ellipse cx="40" cy="20" rx="22" ry="10" fill={hair} />
            <circle cx="40" cy="10" r="8" fill={hair} />
          </>
        ) : (
          <ellipse cx="40" cy="20" rx="26" ry="12" fill={hair} />
        )
      )}
      {/* Eyes */}
      <circle cx="32" cy="36" r="4" fill="white" />
      <circle cx="48" cy="36" r="4" fill="white" />
      <circle cx="33" cy="37" r="2.5" fill="#2d2d2d" />
      <circle cx="49" cy="37" r="2.5" fill="#2d2d2d" />
      <circle cx="34" cy="36" r="1" fill="white" />
      <circle cx="50" cy="36" r="1" fill="white" />
      {/* Mouth */}
      <path d="M34 46 Q40 51 46 46" stroke="#c47a7a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Accessories */}
      {config.accessory === "glasses" && (
        <>
          <circle cx="32" cy="36" r="7" stroke="#333" strokeWidth="2" fill="none" />
          <circle cx="48" cy="36" r="7" stroke="#333" strokeWidth="2" fill="none" />
          <line x1="25" y1="36" x2="20" y2="35" stroke="#333" strokeWidth="2" />
          <line x1="55" y1="36" x2="60" y2="35" stroke="#333" strokeWidth="2" />
          <line x1="39" y1="36" x2="41" y2="36" stroke="#333" strokeWidth="2" />
        </>
      )}
      {config.accessory === "bow" && (
        <path d="M30 18 L38 22 L30 26 Z M50 18 L42 22 L50 26 Z M38 22 L42 22" stroke={hair} strokeWidth="1.5" fill="#ec4899" />
      )}
      {config.accessory === "cap" && (
        <>
          <ellipse cx="40" cy="22" rx="26" ry="8" fill="#6366f1" />
          <rect x="12" y="18" width="56" height="8" rx="4" fill="#6366f1" />
          <rect x="10" y="18" width="16" height="6" rx="3" fill="#4f46e5" />
        </>
      )}
    </svg>
  );
}

export function Members() {
  const { user } = useAppContext();
  const isParent = user?.mode === "parent";
  const { data: members = [], isLoading } = useListMembers({});
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const defaultAvatar = { face: "round", skin: SKIN_TONES[0], hair: "short", hairColor: HAIR_COLORS[0], clothing: "shirt", accessory: "none" };
  const [form, setForm] = useState({ name: "", role: "child", color: MEMBER_COLORS[0], age: "", pin: "", avatarConfig: defaultAvatar });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", role: "child", color: MEMBER_COLORS[0], age: "", pin: "", avatarConfig: defaultAvatar });
    setShowAdd(true);
  };

  const openEdit = (m: any) => {
    let avatarConfig = defaultAvatar;
    try { avatarConfig = JSON.parse(m.avatarConfig || "{}"); } catch {}
    setEditing(m);
    setForm({ name: m.name, role: m.role, color: m.color, age: m.age ? String(m.age) : "", pin: m.pin || "", avatarConfig: { ...defaultAvatar, ...avatarConfig } });
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name, role: form.role as any, color: form.color,
      age: form.age ? Number(form.age) : undefined,
      pin: form.pin || undefined,
      avatarConfig: JSON.stringify(form.avatarConfig),
    };
    if (editing) {
      updateMember.mutate({ id: editing.id, data: data as any }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListMembersQueryKey() }); setShowAdd(false); toast({ title: "Member updated!" }); }
      });
    } else {
      createMember.mutate({ data: data as any }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListMembersQueryKey() }); setShowAdd(false); toast({ title: "Member added!" }); }
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMember.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMembersQueryKey() }); toast({ title: "Member removed" }); }
    });
  };

  const setAvatar = (key: string, val: string) => setForm(f => ({ ...f, avatarConfig: { ...f.avatarConfig, [key]: val } }));

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Family Members</h1>
          <p className="text-muted-foreground">Manage your household members and avatars</p>
        </div>
        {isParent && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Member</Button>}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m: any) => {
          let avatarConfig = defaultAvatar;
          try { avatarConfig = JSON.parse(m.avatarConfig || "{}"); } catch {}
          return (
            <Card key={m.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: m.color }} />
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-muted overflow-hidden flex-shrink-0">
                    <AvatarSVG config={{ ...defaultAvatar, ...avatarConfig }} size={76} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{m.name}</h3>
                      <Badge variant={m.role === "parent" ? "default" : "secondary"} className="text-xs flex-shrink-0">{m.role}</Badge>
                    </div>
                    {m.age && <p className="text-sm text-muted-foreground">Age {m.age}</p>}
                    {isParent && (
                      <div className="flex gap-1 mt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(m)}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Member" : "Add Family Member"}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" autoFocus /></div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="parent">Parent</SelectItem><SelectItem value="child">Child</SelectItem></SelectContent>
                </Select>
              </div>
              {form.role === "child" && (
                <>
                  <div className="space-y-1"><Label>Age</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Optional" /></div>
                  <div className="space-y-1"><Label>PIN (for Kids Mode)</Label><Input type="password" maxLength={6} value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))} placeholder="Optional 4-6 digit PIN" /></div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Profile Color</Label>
              <div className="flex gap-2">
                {MEMBER_COLORS.map(c => (
                  <button key={c} className={`w-7 h-7 rounded-full border-2 ${form.color === c ? "border-foreground scale-110" : "border-transparent"} transition-transform`} style={{ backgroundColor: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-3 block">Avatar Builder</Label>
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-muted flex items-center justify-center">
                  <AvatarSVG config={form.avatarConfig} size={88} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Skin Tone</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SKIN_TONES.map(c => <button key={c} className={`w-6 h-6 rounded-full border-2 ${form.avatarConfig.skin === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setAvatar("skin", c)} />)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Color</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HAIR_COLORS.map(c => <button key={c} className={`w-6 h-6 rounded-full border-2 ${form.avatarConfig.hairColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setAvatar("hairColor", c)} />)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Face</Label>
                    <Select value={form.avatarConfig.face} onValueChange={v => setAvatar("face", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{AVATAR_FACES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Style</Label>
                    <Select value={form.avatarConfig.hair} onValueChange={v => setAvatar("hair", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{AVATAR_HAIRS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Clothing</Label>
                    <Select value={form.avatarConfig.clothing} onValueChange={v => setAvatar("clothing", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{AVATAR_CLOTHING.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Accessory</Label>
                    <Select value={form.avatarConfig.accessory} onValueChange={v => setAvatar("accessory", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{AVATAR_ACCESSORIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editing ? "Save Changes" : "Add Member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
