import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Download, Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Profile = Tables<"profiles">;
type Adviseur = Tables<"adviseurs">;

const ALL_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor", "ep_adviseur"];
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
    const { data } = await supabase.from("adviseurs").select("*").order("naam");
    setAdviseurs(data ?? []);
  };

  // ... adviseur CRUD handlers
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

  // Export functions
  const exportAdviseurs = () => {
    const rows = adviseurs.map((a) => ({
      Nummer: String(a.nummer), Naam: a.naam, "E-mail": a.email ?? "", Actief: a.actief ? "Ja" : "Nee",
    }));
    downloadCsv(rows, "EP-adviseurs.csv");
    toast({ title: "EP-adviseurs geëxporteerd" });
  };

  const exportGebruikers = () => {
    const rows = profiles.map((p) => {
      const row: Record<string, string> = { Naam: p.naam, "E-mail": p.email, Actief: p.actief ? "Ja" : "Nee" };
      ALL_ROLES.forEach((r) => { row[r] = p.roles.includes(r) ? "Ja" : "Nee"; });
      return row;
    });
    downloadCsv(rows, "Gebruikers.csv");
    toast({ title: "Gebruikers geëxporteerd" });
  };

  // Role management
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

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Beheer</h1>

      <Tabs defaultValue="gebruikers">
        <TabsList>
          <TabsTrigger value="gebruikers">Gebruikers</TabsTrigger>
          <TabsTrigger value="adviseurs">EP-adviseurs</TabsTrigger>
          <TabsTrigger value="rollen">Rollen</TabsTrigger>
        </TabsList>

        {/* TAB: Gebruikers */}
        <TabsContent value="gebruikers">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={exportGebruikers}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-2">Naam</th>
                <th className="text-left p-2">E-mail</th>
                <th className="text-left p-2">Actief</th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="text-left p-2">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.naam}</td>
                  <td className="p-2">{p.email}</td>
                  <td className="p-2">
                    <button onClick={() => toggleActief(p.id, p.actief)} className="underline">
                      {p.actief ? "Ja" : "Nee"}
                    </button>
                  </td>
                  {ALL_ROLES.map((role) => {
                    const has = p.roles.includes(role);
                    const isSelfBeheer = role === "beheer" && p.id === user?.id;
                    return (
                      <td key={role} className="p-2">
                        <input
                          type="checkbox"
                          checked={has}
                          disabled={isSelfBeheer}
                          title={isSelfBeheer ? "Je kunt je eigen beheer-rol niet verwijderen" : undefined}
                          onChange={() => toggleRole(p.id, role, has)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* TAB: EP-adviseurs */}
        <TabsContent value="adviseurs">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={adding}>
              <Plus className="h-4 w-4 mr-1" /> Adviseur toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={exportAdviseurs}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-2">Nummer</th>
                <th className="text-left p-2">Naam</th>
                <th className="text-left p-2">E-mail</th>
                <th className="text-left p-2">Actief</th>
                <th className="text-left p-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr className="border-b bg-muted/30">
                  <td className="p-2">
                    <Input type="number" value={addForm.nummer || ""} onChange={(e) => setAddForm({ ...addForm, nummer: Number(e.target.value) })} placeholder="Nr" className="h-8 w-20" />
                  </td>
                  <td className="p-2">
                    <Input value={addForm.naam} onChange={(e) => setAddForm({ ...addForm, naam: e.target.value })} placeholder="Naam" className="h-8" />
                  </td>
                  <td className="p-2">
                    <Input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="E-mail" className="h-8" />
                  </td>
                  <td className="p-2">—</td>
                  <td className="p-2 flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addAdviseur}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setAddForm({ nummer: 0, naam: "", email: "" }); }}><X className="h-4 w-4" /></Button>
                  </td>
                </tr>
              )}
              {adviseurs.map((a) => (
                <tr key={a.id} className="border-b">
                  {editingId === a.id ? (
                    <>
                      <td className="p-2">
                        <Input type="number" value={editForm.nummer || ""} onChange={(e) => setEditForm({ ...editForm, nummer: Number(e.target.value) })} className="h-8 w-20" />
                      </td>
                      <td className="p-2">
                        <Input value={editForm.naam} onChange={(e) => setEditForm({ ...editForm, naam: e.target.value })} className="h-8" />
                      </td>
                      <td className="p-2">
                        <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8" />
                      </td>
                      <td className="p-2">
                        <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className="underline">
                          {a.actief ? "Ja" : "Nee"}
                        </button>
                      </td>
                      <td className="p-2 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{a.nummer}</td>
                      <td className="p-2 font-medium">{a.naam}</td>
                      <td className="p-2">{a.email ?? "—"}</td>
                      <td className="p-2">
                        <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className="underline">
                          {a.actief ? "Ja" : "Nee"}
                        </button>
                      </td>
                      <td className="p-2 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAdviseur(a.id, a.naam)}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        {/* TAB: Rollen */}
        <TabsContent value="rollen">
          {ALL_ROLES.map((role) => {
            const usersWithRole = profiles.filter((p) => p.roles.includes(role));
            const usersWithoutRole = profiles.filter((p) => !p.roles.includes(role) && p.actief);
            return (
              <div key={role} className="mb-6">
                <h3 className="font-semibold text-sm mb-2">{ROLE_LABELS[role]}</h3>
                <table className="w-full text-sm border mb-2">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Naam</th>
                      <th className="text-left p-2">E-mail</th>
                      <th className="text-left p-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithRole.length === 0 && (
                      <tr><td colSpan={3} className="p-2 text-muted-foreground italic">Geen gebruikers met deze rol</td></tr>
                    )}
                    {usersWithRole.map((p) => {
                      const isSelfBeheer = role === "beheer" && p.id === user?.id;
                      return (
                        <tr key={p.id} className="border-b">
                          <td className="p-2">{p.naam}</td>
                          <td className="p-2">{p.email}</td>
                          <td className="p-2">
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                              disabled={isSelfBeheer}
                              title={isSelfBeheer ? "Je kunt je eigen beheer-rol niet verwijderen" : "Rol verwijderen"}
                              onClick={() => toggleRole(p.id, role, true)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {usersWithoutRole.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(userId) => toggleRole(userId, role, false)}>
                      <SelectTrigger className="w-64 h-8 text-sm">
                        <SelectValue placeholder="Gebruiker toevoegen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersWithoutRole.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.naam} ({p.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
