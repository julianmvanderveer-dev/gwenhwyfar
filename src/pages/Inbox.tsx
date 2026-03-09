import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { beoordelingBadge, afwijkingBadge } from "@/lib/badges";
import { orderedFases, faseConfig, getProjectFase, type FaseKey } from "@/components/projecten/faseConfig";
import FaseKolom from "@/components/projecten/FaseKolom";
import ExportFilter from "@/components/projecten/ExportFilter";

type Project = Tables<"projects"> & { adviseurs: { naam: string } | null };
type Finding = Tables<"findings">;

export default function Inbox() {
  const { user, roles, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFindings, setProjectFindings] = useState<Record<string, Finding[]>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [adviseurProjects, setAdviseurProjects] = useState<(Tables<"projects"> & { findings: Finding[] })[]>([]);
  const [zoekterm, setZoekterm] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, roles]);

  const loadData = async () => {
    if (hasRole("ep_adviseur")) await loadAdviseurData();
    if (hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer")) await loadInternalData();
  };

  const loadInternalData = async () => {
    const { data: projectData } = await supabase
      .from("projects")
      .select("*, adviseurs(naam)")
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });
    const loadedProjects = (projectData as Project[]) ?? [];
    setProjects(loadedProjects);

    // Load findings for all projects to detect fase 7 (reactie_ontvangen)
    if (loadedProjects.length > 0) {
      const projectIds = loadedProjects.map((p) => p.id);
      const { data: allFindings } = await supabase
        .from("findings")
        .select("*")
        .in("project_id", projectIds);
      
      const grouped: Record<string, Finding[]> = {};
      (allFindings ?? []).forEach((f) => {
        if (!grouped[f.project_id]) grouped[f.project_id] = [];
        grouped[f.project_id].push(f);
      });
      setProjectFindings(grouped);
    }

    if (hasRole("tekenaar") || hasRole("auditor")) {
      const eigenaar = hasRole("tekenaar") ? "tekenaar" : "auditor";
      const { data: findingData } = await supabase
        .from("findings")
        .select("*")
        .eq("eigenaar_beoordeling", eigenaar as any)
        .eq("status", "reactie_ontvangen");
      setFindings(findingData ?? []);
    }
  };

  const loadAdviseurData = async () => {
    const { data: adviseurRecord } = await supabase
      .from("adviseurs")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!adviseurRecord) {
      setAdviseurProjects([]);
      return;
    }

    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("adviseur_id", adviseurRecord.id)
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });

    if (!projectData || projectData.length === 0) {
      setAdviseurProjects([]);
      return;
    }

    const projectIds = projectData.map((p) => p.id);
    const { data: findingData } = await supabase
      .from("findings")
      .select("*")
      .in("project_id", projectIds)
      .neq("status", "gesloten")
      .eq("zichtbaar_voor_adviseur", true)
      .order("created_at");

    const grouped = projectData.map((p) => ({
      ...p,
      findings: (findingData ?? []).filter((f) => f.project_id === p.id),
    }));

    setAdviseurProjects(grouped);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
    } else {
      toast.success("Project verwijderd");
      loadData();
    }
  };

  // Filter and group projects by fase
  const projectenPerFase = useMemo(() => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const needle = zoekterm.trim().toLowerCase();

    const visible = projects.filter((p) => {
      // Hide archived afgerond projects
      if (p.status === "afgerond" && p.gearchiveerd_op && new Date(p.gearchiveerd_op) < fourteenDaysAgo) return false;
      // Search filter
      if (needle) {
        const searchable = [p.projectnaam, p.adviseurs?.naam].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(needle)) return false;
      }
      return true;
    });

    const grouped: Record<FaseKey, Project[]> = {} as any;
    orderedFases.forEach((f) => (grouped[f] = []));

    visible.forEach((p) => {
      const pFindings = projectFindings[p.id] ?? [];
      const hasReactie = pFindings.some((f) => f.status === "reactie_ontvangen");
      const fase = getProjectFase(p.status, hasReactie);
      grouped[fase].push(p);
    });

    return grouped;
  }, [projects, projectFindings, zoekterm]);

  const faseTellers = orderedFases.map((f) => ({
    fase: f,
    count: projectenPerFase[f]?.length ?? 0,
  }));

  const isBeheer = hasRole("beheer");
  const isInternal = hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer");

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Projecten</h1>
          <p className="text-sm text-muted-foreground">Rollen: {roles.join(", ") || "geen"}</p>
        </div>
        {isBeheer && (
          <Link to="/project/nieuw">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuw project</Button>
          </Link>
        )}
      </div>

      {/* EP-adviseur section */}
      {hasRole("ep_adviseur") && (
        <div>
          <h2 className="font-semibold mb-2">Openstaande audits (EP-adviseur)</h2>
          {adviseurProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen openstaande audits.</p>
          ) : (
            <Tabs defaultValue={adviseurProjects[0]?.id}>
              <TabsList className="flex-wrap h-auto">
                {adviseurProjects.map((p) => (
                  <TabsTrigger key={p.id} value={p.id}>
                    {p.projectnaam}
                    {p.findings.length > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">{p.findings.length}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {adviseurProjects.map((p) => (
                <TabsContent key={p.id} value={p.id}>
                  {p.findings.length === 0 ? (
                    <p className="text-muted-foreground text-sm mt-2">Alle findings zijn beantwoord.</p>
                  ) : (
                    <table className="w-full text-sm border mt-2">
                      <thead>
                        <tr className="border-b bg-muted">
                          <th className="text-left p-2">Controlepunt</th>
                          <th className="text-left p-2">Beoordeling</th>
                          <th className="text-left p-2">Type afwijking</th>
                          <th className="text-left p-2">Deadline</th>
                          <th className="text-left p-2">Actie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.findings.map((f) => (
                          <tr key={f.id} className="border-b">
                            <td className="p-2">{f.controlepunt}</td>
                            <td className="p-2">{beoordelingBadge(f.beoordeling) ?? "—"}</td>
                            <td className="p-2">{afwijkingBadge(f.type_afwijking)}</td>
                            <td className="p-2">
                              {f.deadline ? new Date(f.deadline).toLocaleDateString("nl-NL") : "—"}
                            </td>
                            <td className="p-2">
                              <Link to={`/finding/${f.id}/reactie`} className="underline text-primary">
                                Reageren
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}

      {/* Internal roles: phase-grouped view */}
      {isInternal && (
        <>
          {/* Search + fase tellers */}
          <div className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op projectnaam of adviseur..."
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {faseTellers.map(({ fase, count }) => (
                <div key={fase} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                  <span className="font-medium">{faseConfig[fase].titel}:</span> {count}
                </div>
              ))}
            </div>
          </div>

          {/* Kolom / Lijst tabs */}
          <Tabs defaultValue="kolommen">
            <TabsList>
              <TabsTrigger value="kolommen">Kolomweergave</TabsTrigger>
              <TabsTrigger value="lijst">Onder elkaar</TabsTrigger>
            </TabsList>

            <TabsContent value="kolommen">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {orderedFases.map((fase) => (
                  <FaseKolom
                    key={fase}
                    fase={fase}
                    projecten={projectenPerFase[fase]}
                    canDelete={isBeheer}
                    onDelete={deleteProject}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lijst">
              <div className="space-y-4">
                {orderedFases.map((fase) => (
                  <FaseKolom
                    key={fase}
                    fase={fase}
                    projecten={projectenPerFase[fase]}
                    canDelete={isBeheer}
                    onDelete={deleteProject}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Export */}
          {isBeheer && <ExportFilter projects={projects} />}

          {/* Findings te beoordelen */}
          {findings.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Findings te beoordelen</h2>
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
                        <Link to={`/finding/${f.id}/beoordeling`} className="underline text-primary">
                          Beoordelen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {projects.length === 0 && findings.length === 0 && adviseurProjects.length === 0 && (
        <p className="text-muted-foreground">Geen openstaande items.</p>
      )}
    </div>
  );
}
