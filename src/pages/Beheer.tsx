import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Download, Plus, Pencil, Check, X, Trash2, Settings, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Profile = Tables<"profiles">;
type Adviseur = Tables<"adviseurs">;

const ALL_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor", "ep_adviseur"];
const PROJECT_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor"];
const EP_ROLES: Enums<"app_role">[] = ["ep_adviseur"];

const ROLE_LABELS: Record<Enums<"app_role">, string> = {
  beheer: "Beheer",
  tekenaar: "Tekenaar",
  auditor: "Auditor",
  ep_adviseur: "EP-adviseur",
};

export default function Beheer() {
  const { hasRole, user } = useAuth();
  const [profiles, setProfiles] = useState<(Profile & { roles: Enums<"app_role">[] })[]>([]);
  const [adviseurs, setAdviseurs] = useState<Adviseur[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nummer: 0, naam: "", email: "" });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ nummer: 0, naam: "", email: "" });

  useEffect(() => {
    loadUsers();
    loadAdviseurs();
  }, []);

  const loadUsers = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").order("naam");
    const { data: roleData } = await supabase.from("user_roles").select("*");
    const combined = (profileData ?? []).map((p) => ({
      ...p,
      roles: (roleData ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
    setProfiles(combined);
  };

  const loadAdviseurs = async () => {
    const { data } = await supabase.from("adviseurs").select("*").order("nummer");
    setAdviseurs(data ?? []);
  };

  const toggleRole = async (userId: string, role: Enums<"app_role">, hasIt: boolean) => {
    if (hasIt) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role });
    }
    loadUsers();
    toast({ title: hasIt ? "Rol verwijderd" : "Rol toegevoegd" });
  };

  const toggleActief = async (userId: string, currentActief: boolean) => {
    await supabase.from("profiles").update({ actief: !currentActief }).eq("id", userId);
    loadUsers();
  };

  // Adviseur CRUD
  const toggleAdviseurActief = async (id: string, currentActief: boolean) => {
    await supabase.from("adviseurs").update({ actief: !currentActief }).eq("id", id);
    loadAdviseurs();
  };

  const startEdit = (a: Adviseur) => {
    setEditingId(a.id);
    setEditForm({ nummer: a.nummer, naam: a.naam, email: a.email ?? "" });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.naam.trim()) return;
    await supabase.from("adviseurs").update({
      nummer: editForm.nummer,
      naam: editForm.naam.trim(),
      email: editForm.email.trim() || null,
    }).eq("id", editingId);
    setEditingId(null);
    loadAdviseurs();
    toast({ title: "Adviseur bijgewerkt" });
  };

  const addAdviseur = async () => {
    if (!addForm.naam.trim() || !addForm.nummer) return;
    const { error } = await supabase.from("adviseurs").insert({
      nummer: addForm.nummer,
      naam: addForm.naam.trim(),
      email: addForm.email.trim() || null,
    });
    if (error) {
      toast({ title: "Fout bij toevoegen", description: error.message, variant: "destructive" });
      return;
    }
    setAdding(false);
    setAddForm({ nummer: 0, naam: "", email: "" });
    loadAdviseurs();
    toast({ title: "Adviseur toegevoegd" });
  };

  const deleteAdviseur = async (id: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?`)) return;
    await supabase.from("adviseurs").delete().eq("id", id);
    loadAdviseurs();
    toast({ title: "Adviseur verwijderd" });
  };

  const deleteProfile = async (userId: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?`)) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    loadUsers();
    toast({ title: "Medewerker verwijderd" });
  };

  const exportGebruikers = () => {
    const rows = profiles.map((p) => {
      const row: Record<string, string> = { Naam: p.naam, "E-mail": p.email, Actief: p.actief ? "Ja" : "Nee" };
      PROJECT_ROLES.forEach((r) => { row[ROLE_LABELS[r]] = p.roles.includes(r) ? "Ja" : "Nee"; });
      return row;
    });
    downloadCsv(rows, "Projectteam.csv");
    toast({ title: "Projectteam geëxporteerd" });
  };

  const exportAdviseurs = () => {
    const rows = adviseurs.map((a) => ({
      Nummer: String(a.nummer).padStart(3, '0'), Naam: a.naam, "E-mail": a.email ?? "", Actief: a.actief ? "Ja" : "Nee",
    }));
    downloadCsv(rows, "EP-adviseurs.csv");
    toast({ title: "EP-adviseurs geëxporteerd" });
  };

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Beheer</h1>
          <p className="text-xs text-muted-foreground">Team- en adviseurbeheer</p>
        </div>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Projectteam
          </TabsTrigger>
          <TabsTrigger value="adviseurs" className="gap-1.5">
            EP-adviseurs
          </TabsTrigger>
        </TabsList>

        {/* TAB: Projectteam */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportGebruikers} className="shadow-sm">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                {/* Group headers */}
                 <tr className="border-b bg-secondary/60">
                   <th colSpan={2} />
                   <th colSpan={3} className="text-center px-2 py-2 text-xs font-bold uppercase tracking-wider text-accent border-l border-r">
                     Projectrollen
                   </th>
                   <th colSpan={2} />
                 </tr>
                {/* Column headers */}
                <tr className="border-b bg-secondary/40">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Naam</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                  {PROJECT_ROLES.map((r) => (
                    <th key={r} className={`text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground ${r === "beheer" ? "border-l" : ""} ${r === "auditor" ? "border-r" : ""}`}>
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                   <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Actief</th>
                   <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => (
                  <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-2.5 font-medium">{p.naam}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                    {PROJECT_ROLES.map((role) => {
                      const has = p.roles.includes(role);
                      const isSelfBeheer = role === "beheer" && p.id === user?.id;
                      return (
                        <td key={role} className={`text-center px-3 py-2.5 ${role === "beheer" ? "border-l" : ""} ${role === "auditor" ? "border-r" : ""}`}>
                          <Checkbox
                            checked={has}
                            disabled={isSelfBeheer}
                            title={isSelfBeheer ? "Je kunt je eigen beheer-rol niet verwijderen" : undefined}
                            onCheckedChange={() => toggleRole(p.id, role, has)}
                            className="mx-auto"
                          />
                        </td>
                      );
                    })}
                     <td className="text-center px-3 py-2.5">
                       <button
                         onClick={() => toggleActief(p.id, p.actief)}
                         className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
                       >
                         {p.actief ? "Ja" : "Nee"}
                       </button>
                     </td>
                     <td className="text-center px-3 py-2.5">
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-7 w-7 text-destructive"
                         disabled={p.id === user?.id}
                         title={p.id === user?.id ? "Je kunt je eigen account niet verwijderen" : "Verwijderen"}
                         onClick={() => deleteProfile(p.id, p.naam)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB: EP-adviseurs */}
        <TabsContent value="adviseurs" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={adding} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Adviseur toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={exportAdviseurs} className="shadow-sm">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/60">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nummer</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Naam</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actief</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {adding && (
                  <tr className="border-b bg-primary/5">
                    <td className="px-4 py-2.5">
                      <Input type="number" value={addForm.nummer || ""} onChange={(e) => setAddForm({ ...addForm, nummer: Number(e.target.value) })} placeholder="Nr" className="h-8 w-20" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={addForm.naam} onChange={(e) => setAddForm({ ...addForm, naam: e.target.value })} placeholder="Naam" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="E-mail" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5 text-center">—</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addAdviseur}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setAddForm({ nummer: 0, naam: "", email: "" }); }}><X className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
                {adviseurs.map((a, i) => (
                  <tr key={a.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    {editingId === a.id ? (
                      <>
                        <td className="px-4 py-2.5">
                          <Input type="number" value={editForm.nummer || ""} onChange={(e) => setEditForm({ ...editForm, nummer: Number(e.target.value) })} className="h-8 w-20" />
                        </td>
                        <td className="px-4 py-2.5">
                          <Input value={editForm.naam} onChange={(e) => setEditForm({ ...editForm, naam: e.target.value })} className="h-8" />
                        </td>
                        <td className="px-4 py-2.5">
                          <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8" />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {a.actief ? "Ja" : "Nee"}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.nummer}</td>
                        <td className="px-4 py-2.5 font-medium">{a.naam}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.email ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {a.actief ? "Ja" : "Nee"}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAdviseur(a.id, a.naam)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
