import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Download, Plus, Pencil, Check, X, Trash2, Settings, Users, Eye, EyeOff, ArrowRightLeft, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Profile = Tables<"profiles">;
type Adviseur = Tables<"adviseurs">;

const ALL_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor", "ep_adviseur"];
const PROJECT_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor"];
const EP_ROLES: Enums<"app_role">[] = ["ep_adviseur"];

const ROLE_PRIORITY: Record<string, number> = { beheer: 1, tekenaar: 2, auditor: 3 };

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

  // Team member add state
  const [addingMember, setAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ naam: "", email: "", password: "", roles: [] as Enums<"app_role">[] });
  const [showPassword, setShowPassword] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);

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
    // Sort by role priority: Beheer → Tekenaar → Auditor → geen rol, then alphabetically
    combined.sort((a, b) => {
      const prioA = Math.min(...a.roles.map((r) => ROLE_PRIORITY[r] ?? 99), 99);
      const prioB = Math.min(...b.roles.map((r) => ROLE_PRIORITY[r] ?? 99), 99);
      return prioA - prioB || a.naam.localeCompare(b.naam);
    });
    setProfiles(combined);
  };

  const loadAdviseurs = async () => {
    const { data } = await supabase.from("adviseurs").select("*").order("nummer");
    setAdviseurs(data ?? []);
  };

  const toggleRole = async (userId: string, role: Enums<"app_role">, hasIt: boolean) => {
    try {
      if (hasIt) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
      loadUsers();
      toast({ title: hasIt ? "Rol verwijderd" : "Rol toegevoegd" });
    } catch (err: any) {
      toast({ title: "Fout bij rolwijziging", description: err.message, variant: "destructive" });
    }
  };

  const toggleActief = async (userId: string, currentActief: boolean) => {
    const { error } = await supabase.from("profiles").update({ actief: !currentActief }).eq("id", userId);
    if (error) {
      toast({ title: "Fout bij statuswijziging", description: error.message, variant: "destructive" });
      return;
    }
    loadUsers();
  };

  // Adviseur CRUD
  const toggleAdviseurActief = async (id: string, currentActief: boolean) => {
    const { error } = await supabase.from("adviseurs").update({ actief: !currentActief }).eq("id", id);
    if (error) {
      toast({ title: "Fout bij statuswijziging", description: error.message, variant: "destructive" });
      return;
    }
    loadAdviseurs();
  };

  const startEdit = (a: Adviseur) => {
    setEditingId(a.id);
    setEditForm({ nummer: a.nummer, naam: a.naam, email: a.email ?? "" });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.naam.trim()) return;
    const { error } = await supabase.from("adviseurs").update({
      nummer: editForm.nummer,
      naam: editForm.naam.trim(),
      email: editForm.email.trim() || null,
    }).eq("id", editingId);
    if (error) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
      return;
    }
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
    const { error } = await supabase.from("adviseurs").delete().eq("id", id);
    if (error) {
      toast({ title: "Fout bij verwijderen", description: error.message, variant: "destructive" });
      return;
    }
    loadAdviseurs();
    toast({ title: "Adviseur verwijderd" });
  };

  const deleteProfile = async (userId: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?`)) return;
    try {
      const { error: roleError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (roleError) throw roleError;
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileError) throw profileError;
      loadUsers();
      toast({ title: "Medewerker verwijderd" });
    } catch (err: any) {
      toast({ title: "Fout bij verwijderen", description: err.message, variant: "destructive" });
    }
  };

  const addMember = async () => {
    if (!memberForm.naam.trim()) {
      toast({ title: "Naam is verplicht", variant: "destructive" });
      return;
    }
    if (!memberForm.email.trim()) {
      toast({ title: "E-mail is verplicht", variant: "destructive" });
      return;
    }
    if (!memberForm.password) {
      toast({ title: "Wachtwoord is verplicht", variant: "destructive" });
      return;
    }
    setSubmittingMember(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          naam: memberForm.naam.trim(),
          email: memberForm.email.trim(),
          password: memberForm.password,
          roles: memberForm.roles,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAddingMember(false);
      setMemberForm({ naam: "", email: "", password: "", roles: [] });
      setShowPassword(false);
      loadUsers();
      toast({ title: "Medewerker toegevoegd" });
    } catch (err: any) {
      toast({ title: "Fout bij toevoegen", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingMember(false);
    }
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
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setAddingMember(true)} disabled={addingMember} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Medewerker toevoegen
            </Button>
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
                   <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Wachtwoord</th>
                   <th />
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
                {addingMember && (
                  <tr className="border-b bg-primary/5">
                    <td className="px-4 py-2.5">
                      <Input value={memberForm.naam} onChange={(e) => setMemberForm({ ...memberForm, naam: e.target.value })} placeholder="Naam" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="E-mail" className="h-8" />
                    </td>
                    {PROJECT_ROLES.map((role) => (
                      <td key={role} className={`text-center px-3 py-2.5 ${role === "beheer" ? "border-l" : ""} ${role === "auditor" ? "border-r" : ""}`}>
                        <Checkbox
                          checked={memberForm.roles.includes(role)}
                          onCheckedChange={(checked) => {
                            setMemberForm({
                              ...memberForm,
                              roles: checked ? [...memberForm.roles, role] : memberForm.roles.filter((r) => r !== role),
                            });
                          }}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={memberForm.password}
                          onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                          placeholder="Wachtwoord"
                          className="h-8 pr-8"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addMember} disabled={submittingMember}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingMember(false); setMemberForm({ naam: "", email: "", password: "", roles: [] }); setShowPassword(false); }}><X className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
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
                        <td className="px-4 py-2.5 text-muted-foreground">{String(a.nummer).padStart(3, '0')}</td>
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
