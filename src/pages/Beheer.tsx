import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Download } from "lucide-react";

type Profile = Tables<"profiles">;
type UserRole = Tables<"user_roles">;
type Project = Tables<"projects"> & { adviseurs: { naam: string } | null };

const ALL_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor", "ep_adviseur"];

export default function Beheer() {
  const { hasRole } = useAuth();
  const [profiles, setProfiles] = useState<(Profile & { roles: Enums<"app_role">[] })[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadUsers();
    loadProjects();
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

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, adviseurs(naam)")
      .order("datum_aangemaakt", { ascending: false });
    setProjects((data as Project[]) ?? []);
  };

  const exportGebruikers = () => {
    const rows = profiles.map((p) => {
      const row: Record<string, string> = {
        Naam: p.naam,
        "E-mail": p.email,
        Actief: p.actief ? "Ja" : "Nee",
      };
      ALL_ROLES.forEach((r) => { row[r] = p.roles.includes(r) ? "Ja" : "Nee"; });
      return row;
    });
    downloadCsv(rows, "Gebruikers.csv");
    toast({ title: "Gebruikers geëxporteerd" });
  };

  const exportProjecten = () => {
    const rows = projects.map((p) => ({
      Projectnaam: p.projectnaam,
      Status: p.status,
      Categorie: p.audit_categorie,
      Soort: p.audit_soort,
      Prioriteit: p.prioriteit ? "Ja" : "Nee",
      Adviseur: p.adviseurs?.naam ?? "",
      "Datum aangemaakt": new Date(p.datum_aangemaakt).toLocaleDateString("nl-NL"),
    }));
    downloadCsv(rows, "Projecten.csv");
    toast({ title: "Projecten geëxporteerd" });
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

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Gebruikersbeheer</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportGebruikers}>
            <Download className="h-4 w-4 mr-1" /> Export gebruikers
          </Button>
          <Button variant="outline" size="sm" onClick={exportProjecten}>
            <Download className="h-4 w-4 mr-1" /> Export projecten
          </Button>
        </div>
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
                return (
                  <td key={role} className="p-2">
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => toggleRole(p.id, role, has)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
