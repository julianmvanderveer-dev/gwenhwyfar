import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { beoordelingBadge, afwijkingBadge } from "@/lib/badges";
import { orderedFases, faseConfig, getProjectFase, type FaseKey } from "@/components/projecten/faseConfig";
import FaseTabel from "@/components/projecten/FaseTabel";
import ExportFilter from "@/components/projecten/ExportFilter";
import MedewerkerDashboard from "@/components/dashboard/MedewerkerDashboard";

type Project = Tables<"projects"> & { adviseurs: { naam: string } | null; toegewezen_profiel?: { naam: string } | null };
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
    let loadedProjects = (projectData as Project[]) ?? [];

    // Load toewijzing profile names for beheer
    if (hasRole("beheer") && loadedProjects.length > 0) {
      const userIds = [...new Set(loadedProjects.filter(p => p.toegewezen_aan).map(p => p.toegewezen_aan!))];
      if (userIds.length > 0) {
        const { data: profielData } = await supabase.from("profiles").select("id, naam").in("id", userIds);
        const profielMap = new Map((profielData ?? []).map(p => [p.id, p]));
        loadedProjects = loadedProjects.map(p => ({
          ...p,
          toegewezen_profiel: p.toegewezen_aan ? profielMap.get(p.toegewezen_aan) ?? null : null,
        }));
      }
    }
    setProjects(loadedProjects);

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

  const projectenPerFase = useMemo(() => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const needle = zoekterm.trim().toLowerCase();

    const visible = projects.filter((p) => {
      if (p.status === "afgerond" && p.gearchiveerd_op && new Date(p.gearchiveerd_op) < fourteenDaysAgo) return false;
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

  const totalVisible = orderedFases.reduce((sum, f) => sum + (projectenPerFase[f]?.length ?? 0), 0);
  const isBeheer = hasRole("beheer");
  const isInternal = hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer");

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Projecten</h1>
            <p className="text-xs text-muted-foreground">{totalVisible} actieve projecten · {roles.join(", ") || "geen rol"}</p>
          </div>
        </div>
        {isBeheer && (
          <Link to="/project/nieuw">
            <Button size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Nieuw project
            </Button>
          </Link>
        )}
      </div>

      {/* EP-adviseur section */}
      {hasRole("ep_adviseur") && (
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-sm">Openstaande audits (EP-adviseur)</h2>
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
                    <div className="border rounded-lg overflow-hidden mt-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/60 border-b">
                            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Beoordeling</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type afwijking</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Deadline</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.findings.map((f, i) => (
                            <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                              <td className="px-4 py-2.5">{f.controlepunt}</td>
                              <td className="px-4 py-2.5">{beoordelingBadge(f.beoordeling) ?? "—"}</td>
                              <td className="px-4 py-2.5">{afwijkingBadge(f.type_afwijking)}</td>
                              <td className="px-4 py-2.5">{f.deadline ? new Date(f.deadline).toLocaleDateString("nl-NL") : "—"}</td>
                              <td className="px-4 py-2.5">
                                {f.status === "reactie_ontvangen" ? (
                                  <Badge variant="secondary" className="text-xs">Reactie ingediend</Badge>
                                ) : (
                                  <Link to={`/finding/${f.id}/reactie`} className="text-accent hover:underline font-medium">
                                    Reageren
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}

      {/* Internal roles: collapsible table view */}
      {isInternal && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op projectnaam of adviseur..."
              value={zoekterm}
              onChange={(e) => setZoekterm(e.target.value)}
              className="pl-10 h-9 bg-card shadow-sm"
            />
          </div>

          {/* Fase tellers strip */}
          <div className="flex flex-wrap gap-1.5">
            {orderedFases.map((fase, i) => {
              const count = projectenPerFase[fase]?.length ?? 0;
              const config = faseConfig[fase];
              return (
                <div key={fase} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-card border shadow-sm">
                  <config.icon className={`h-3.5 w-3.5 ${config.accentClass}`} />
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Collapsible tables per fase */}
          <div className="space-y-2">
            {orderedFases.map((fase, i) => (
              <FaseTabel
                key={fase}
                fase={fase}
                faseIndex={i}
                projecten={projectenPerFase[fase]}
                canDelete={isBeheer}
                onDelete={deleteProject}
                defaultOpen={projectenPerFase[fase].length > 0}
                showToewijzing={isBeheer}
              />
            ))}
          </div>

          {/* Export */}
          {isBeheer && <ExportFilter projects={projects} />}

          {/* Findings te beoordelen */}
          {findings.length > 0 && (
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h2 className="font-semibold mb-3 text-sm">Findings te beoordelen</h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/60 border-b">
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Onderdeel</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f, i) => (
                      <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2.5">{f.onderdeel}</td>
                        <td className="px-4 py-2.5">{f.controlepunt}</td>
                        <td className="px-4 py-2.5">{f.status}</td>
                        <td className="px-4 py-2.5">
                          <Link to={`/finding/${f.id}/beoordeling`} className="text-accent hover:underline font-medium">
                            Beoordelen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {projects.length === 0 && findings.length === 0 && adviseurProjects.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Geen openstaande items.</p>
      )}
    </div>
  );
}
