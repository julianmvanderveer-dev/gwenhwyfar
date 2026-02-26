import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;

export default function Inbox() {
  const { user, roles, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [findings, setFindings] = useState<(Finding & { project_naam?: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, roles]);

  const loadData = async () => {
    // Load projects based on role
    let query = supabase.from("projects").select("*");

    if (hasRole("tekenaar")) {
      query = query.in("status", ["geselecteerd", "deel1_bezig"]);
    } else if (hasRole("ep_adviseur")) {
      query = query.in("status", ["wacht_op_deel2", "afgerond"]);
    } else if (hasRole("adviseur")) {
      query = query.eq("adviseur_id", user!.id).in("status", ["reactie_open"]);
    } else if (hasRole("planner")) {
      query = query.neq("status", "gesloten");
    }
    // beheer sees all (no filter)

    const { data: projectData } = await query.order("datum_aangemaakt", { ascending: false });
    setProjects(projectData ?? []);

    // For adviseur, also load open findings
    if (hasRole("adviseur")) {
      const { data: findingData } = await supabase
        .from("findings")
        .select("*")
        .eq("status", "open")
        .eq("zichtbaar_voor_adviseur", true);
      setFindings(findingData ?? []);
    }

    // For tekenaar/ep_adviseur, load findings needing assessment
    if (hasRole("tekenaar") || hasRole("ep_adviseur")) {
      const eigenaar = hasRole("tekenaar") ? "tekenaar" : "ep_adviseur";
      const { data: findingData } = await supabase
        .from("findings")
        .select("*")
        .eq("eigenaar_beoordeling", eigenaar as any)
        .eq("status", "reactie_ontvangen");
      setFindings(findingData ?? []);
    }
  };

  const statusLabel: Record<string, string> = {
    geselecteerd: "Geselecteerd",
    deel1_bezig: "Deel 1 bezig",
    wacht_op_deel2: "Wacht op deel 2",
    afgerond: "Afgerond",
    reactie_open: "Reactie open",
    gesloten: "Gesloten",
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Inbox</h1>
      <p className="text-sm mb-4 text-muted-foreground">
        Rollen: {roles.join(", ") || "geen"}
      </p>

      {projects.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Projecten</h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-2">Project</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Categorie</th>
                <th className="text-left p-2">Soort</th>
                <th className="text-left p-2">Prioriteit</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">
                    <Link to={`/project/${p.id}`} className="underline text-primary">
                      {p.projectnaam}
                    </Link>
                  </td>
                  <td className="p-2">{statusLabel[p.status] || p.status}</td>
                  <td className="p-2">{p.audit_categorie}</td>
                  <td className="p-2">{p.audit_soort}</td>
                  <td className="p-2">{p.prioriteit ? "Ja" : "Nee"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">
            {hasRole("adviseur") ? "Open findings (mijn projecten)" : "Findings te beoordelen"}
          </h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left p-2">Onderdeel</th>
                <th className="text-left p-2">Controlepunt</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actie</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="p-2">{f.onderdeel}</td>
                  <td className="p-2">{f.controlepunt}</td>
                  <td className="p-2">{f.status}</td>
                  <td className="p-2">
                    <Link
                      to={hasRole("adviseur") ? `/finding/${f.id}/reactie` : `/finding/${f.id}/beoordeling`}
                      className="underline text-primary"
                    >
                      {hasRole("adviseur") ? "Reageren" : "Beoordelen"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {projects.length === 0 && findings.length === 0 && (
        <p className="text-muted-foreground">Geen openstaande items.</p>
      )}
    </div>
  );
}
