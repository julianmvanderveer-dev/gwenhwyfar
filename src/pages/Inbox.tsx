import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LayoutDashboard, Download } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { beoordelingBadge, afwijkingBadge, statusBadge } from "@/lib/badges";
import { orderedFases, faseConfig, getProjectFase, type FaseKey } from "@/components/projecten/faseConfig";
import FaseTabel from "@/components/projecten/FaseTabel";
import ExportFilter from "@/components/projecten/ExportFilter";
import MedewerkerDashboard from "@/components/dashboard/MedewerkerDashboard";
import { Download, FileText } from "lucide-react";

type Project = Tables<"projects"> & { adviseurs: { naam: string } | null; toegewezen_profiel?: { naam: string } | null };
type Finding = Tables<"findings"> & { projectnaam?: string; laatste_reactie?: string; laatste_bijlage?: string | null };

export default function Inbox() {
  const { user, roles, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFindings, setProjectFindings] = useState<Record<string, Finding[]>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [adviseurFindings, setAdviseurFindings] = useState<Finding[]>([]);
  const [adviseurFilterProject, setAdviseurFilterProject] = useState<string>("alle");
  const [adviseurFilterStatus, setAdviseurFilterStatus] = useState<string>("alle");
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
      setAdviseurFindings([]);
      return;
    }

    const { data: projectData } = await supabase
      .from("projects")
      .select("id, projectnaam")
      .eq("adviseur_id", adviseurRecord.id);

    if (!projectData || projectData.length === 0) {
      setAdviseurFindings([]);
      return;
    }

    const projectIds = projectData.map((p) => p.id);
    const projectMap = new Map(projectData.map((p) => [p.id, p.projectnaam]));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: findingData } = await supabase
      .from("findings")
      .select("*")
      .in("project_id", projectIds)
      .in("status", ["open", "reactie_ontvangen", "reactie_goedgekeurd"] as any)
      .eq("zichtbaar_voor_adviseur", true)
      .order("created_at");

    // Filter out reactie_goedgekeurd older than 7 days
    const filtered = (findingData ?? []).filter((f) => {
      if (f.status === "reactie_goedgekeurd") {
        const goedOp = (f as any).goedgekeurd_op;
        if (goedOp && new Date(goedOp) < new Date(sevenDaysAgo)) return false;
      }
      return true;
    });

    // Load latest message per finding for reactie column
    const findingIds = filtered.map((f) => f.id);
    let messageMap: Record<string, { bericht: string; bijlage_pad: string | null }> = {};
    if (findingIds.length > 0) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("finding_id, bericht, bijlage_pad, datum")
        .in("finding_id", findingIds)
        .order("datum", { ascending: false });
      // Keep only latest per finding
      (msgs ?? []).forEach((m) => {
        if (!messageMap[m.finding_id]) {
          messageMap[m.finding_id] = { bericht: m.bericht, bijlage_pad: m.bijlage_pad };
        }
      });
    }

    const enriched: Finding[] = filtered.map((f) => ({
      ...f,
      projectnaam: projectMap.get(f.project_id) ?? "—",
      laatste_reactie: messageMap[f.id]?.bericht ?? "",
      laatste_bijlage: messageMap[f.id]?.bijlage_pad ?? null,
    }));

    setAdviseurFindings(enriched);
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
  const isMedewerker = hasRole("tekenaar") || hasRole("auditor");
  const adviseurStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      open: { label: "Open", className: "bg-orange-100 text-orange-700" },
      reactie_ontvangen: { label: "Reactie ingediend", className: "bg-blue-100 text-blue-700" },
      reactie_goedgekeurd: { label: "Reactie goedgekeurd", className: "bg-green-100 text-green-700" },
    };
    const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>;
  };

  const adviseurProjectNames = useMemo(() => {
    const names = new Set(adviseurFindings.map((f) => f.projectnaam).filter(Boolean));
    return Array.from(names).sort();
  }, [adviseurFindings]);

  const filteredAdviseurFindings = useMemo(() => {
    return adviseurFindings.filter((f) => {
      if (adviseurFilterProject !== "alle" && f.projectnaam !== adviseurFilterProject) return false;
      if (adviseurFilterStatus !== "alle" && f.status !== adviseurFilterStatus) return false;
      return true;
    });
  }, [adviseurFindings, adviseurFilterProject, adviseurFilterStatus]);

  const handleDownload = async (path: string) => {
    const { data, error } = await supabase.storage.from("finding-documents").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank");
  };

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
          <h2 className="font-semibold mb-3 text-sm">Afwijkingen overzicht (EP-adviseur)</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={adviseurFilterProject} onValueChange={setAdviseurFilterProject}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Alle projecten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle projecten</SelectItem>
                {adviseurProjectNames.map((name) => (
                  <SelectItem key={name} value={name!}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={adviseurFilterStatus} onValueChange={setAdviseurFilterStatus}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="reactie_ontvangen">Reactie ingediend</SelectItem>
                <SelectItem value="reactie_goedgekeurd">Reactie goedgekeurd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAdviseurFindings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen afwijkingen gevonden.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Projectnaam</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type afwijking</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reactie</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Document</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdviseurFindings.map((f, i) => (
                    <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-4 py-2.5 font-medium">{f.projectnaam}</td>
                      <td className="px-4 py-2.5">{f.controlepunt}</td>
                      <td className="px-4 py-2.5">{afwijkingBadge(f.type_afwijking)}</td>
                      <td className="px-4 py-2.5">{adviseurStatusBadge(f.status)}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate" title={f.laatste_reactie ?? ""}>
                        {f.laatste_reactie || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {f.laatste_bijlage ? (
                          <button onClick={() => handleDownload(f.laatste_bijlage!)} className="text-accent hover:underline text-xs flex items-center gap-1">
                            <Download className="h-3 w-3" /> Download
                          </button>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {f.status === "open" ? (
                          <Link to={`/finding/${f.id}/reactie`} className="text-accent hover:underline font-medium text-sm">
                            Reageren
                          </Link>
                        ) : f.status === "reactie_goedgekeurd" ? (
                          <Badge variant="secondary" className="text-xs">Goedgekeurd</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Ingediend</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medewerker dashboard (tekenaar/auditor) */}
      {isMedewerker && !isBeheer && <MedewerkerDashboard />}

      {/* Beheer: full phase tables */}
      {isBeheer && (
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
          <ExportFilter projects={projects} />
        </>
      )}

      {projects.length === 0 && findings.length === 0 && adviseurFindings.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Geen openstaande items.</p>
      )}
    </div>
  );
}
