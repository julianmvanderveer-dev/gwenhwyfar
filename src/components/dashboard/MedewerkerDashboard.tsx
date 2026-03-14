import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, FolderOpen, Inbox } from "lucide-react";

interface FindingRow {
  id: string;
  controlepunt: string;
  onderdeel: string;
  project_id: string;
  projectnaam: string;
  adviseur_naam: string;
  reactie_tekst: string | null;
  reactie_datum: string | null;
}

interface MijnProject {
  id: string;
  projectnaam: string;
  audit_categorie: string;
  status: string;
  toewijzing: string;
  toegewezen_aan: string | null;
}

export default function MedewerkerDashboard() {
  const { user, hasRole } = useAuth();
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [projecten, setProjecten] = useState<MijnProject[]>([]);
  const [loading, setLoading] = useState(true);

  const eigenaarRol = hasRole("tekenaar") ? "tekenaar" : "auditor";

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFindings(), loadProjecten()]);
    setLoading(false);
  };

  const loadFindings = async () => {
    // 1. Get findings assigned to this role with status reactie_ontvangen
    const { data: findingData } = await supabase
      .from("findings")
      .select("id, controlepunt, onderdeel, project_id")
      .eq("eigenaar_beoordeling", eigenaarRol as any)
      .eq("status", "reactie_ontvangen");

    if (!findingData || findingData.length === 0) {
      setFindings([]);
      return;
    }

    // 2. Get project + adviseur info
    const projectIds = [...new Set(findingData.map((f) => f.project_id))];
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, projectnaam, adviseur_id, adviseurs(naam)")
      .in("id", projectIds);

    const projectMap = new Map(
      (projectData ?? []).map((p: any) => [p.id, { projectnaam: p.projectnaam, adviseur_naam: p.adviseurs?.naam ?? "Onbekend" }])
    );

    // 3. Get most recent message per finding (the adviseur's response)
    const findingIds = findingData.map((f) => f.id);
    const { data: messageData } = await supabase
      .from("messages")
      .select("finding_id, bericht, datum")
      .in("finding_id", findingIds)
      .order("datum", { ascending: false });

    // Keep only the most recent message per finding
    const latestMessages = new Map<string, { bericht: string; datum: string }>();
    (messageData ?? []).forEach((m) => {
      if (!latestMessages.has(m.finding_id)) {
        latestMessages.set(m.finding_id, { bericht: m.bericht, datum: m.datum });
      }
    });

    // 4. Combine and sort
    const rows: FindingRow[] = findingData.map((f) => {
      const proj = projectMap.get(f.project_id);
      const msg = latestMessages.get(f.id);
      return {
        id: f.id,
        controlepunt: f.controlepunt,
        onderdeel: f.onderdeel,
        project_id: f.project_id,
        projectnaam: proj?.projectnaam ?? "Onbekend",
        adviseur_naam: proj?.adviseur_naam ?? "Onbekend",
        reactie_tekst: msg?.bericht ?? null,
        reactie_datum: msg?.datum ?? null,
      };
    });

    rows.sort((a, b) => {
      if (!a.reactie_datum && !b.reactie_datum) return 0;
      if (!a.reactie_datum) return 1;
      if (!b.reactie_datum) return -1;
      return new Date(b.reactie_datum).getTime() - new Date(a.reactie_datum).getTime();
    });

    setFindings(rows);
  };

  const loadProjecten = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, projectnaam, audit_categorie, status, toewijzing, toegewezen_aan")
      .neq("status", "gesloten")
      .neq("status", "afgerond")
      .order("datum_aangemaakt", { ascending: false });

    // RLS already filters: only assigned to me OR pool unassigned
    // Additionally filter out projects claimed by others
    let filtered = (data ?? []).filter(
      (p) => p.toegewezen_aan === user!.id || (p.toewijzing === "pool" && !p.toegewezen_aan)
    );

    // Role-based visibility filter
    if (eigenaarRol === "auditor") {
      filtered = filtered.filter(
        (p) => !["nog_niet_begonnen", "deel1_bezig"].includes(p.status)
      );
    }

    setProjecten(filtered);
  };

  const truncate = (text: string, max = 80) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Laden…
      </div>
    );
  }

  return (
    <Tabs defaultValue="findings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="findings" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Findings
          {findings.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
              {findings.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="projecten" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Mijn projecten
        </TabsTrigger>
      </TabsList>

      {/* ─── Findings ─── */}
      <TabsContent value="findings">
        {findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Er zijn momenteel geen openstaande findings.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">EP-adviseur</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reactie</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Datum</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f, i) => (
                  <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                    <td className="px-4 py-2.5 font-medium">{f.projectnaam}</td>
                    <td className="px-4 py-2.5">{f.adviseur_naam}</td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs">
                      {f.reactie_tekst ? truncate(f.reactie_tekst) : <span className="italic">Geen bericht</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {f.reactie_datum ? new Date(f.reactie_datum).toLocaleDateString("nl-NL") : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link to={`/finding/${f.id}/beoordeling`} className="text-primary hover:underline font-medium">
                        Beoordelen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      {/* ─── Mijn projecten ─── */}
      <TabsContent value="projecten">
        {projecten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Geen beschikbare projecten.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Projectnaam</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                </tr>
              </thead>
              <tbody>
                {projecten.map((p, i) => {
                  const isNew = p.status === "nog_niet_begonnen";
                  return (
                    <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                      <td className="px-4 py-2.5 font-medium">{p.projectnaam}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary" className="text-xs">{p.audit_categorie}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link to={`/project/${p.id}`}>
                          <Button size="sm" variant={isNew ? "default" : "outline"} className="h-7 text-xs">
                            {isNew ? "Starten" : "Openen"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
