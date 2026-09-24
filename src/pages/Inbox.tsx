import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LayoutDashboard, FolderKanban, Clock3, CheckCircle2, ArrowRightLeft, FileDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { orderedFases, faseConfig, getProjectFase, type FaseKey, bezigFases } from "@/components/projecten/faseConfig";
import AdviseurSectie from "@/components/dashboard/AdviseurSectie";
import AdviseurOverzicht from "@/components/dashboard/AdviseurOverzicht";
import NieuwOverzichtMelding from "@/components/dashboard/NieuwOverzichtMelding";
import FaseTabel, { type ToewijsbarePersoon, type ProjectRow } from "@/components/projecten/FaseTabel";
import ToewijzingenBeheer from "@/components/projecten/ToewijzingenBeheer";
import AlleProjectenExport from "@/components/projecten/AlleProjectenExport";
import BulkPdfExport from "@/components/projecten/BulkPdfExport";
import FoutenAnalyse from "@/components/beheer/FoutenAnalyse";
import MedewerkerDashboard from "@/components/dashboard/MedewerkerDashboard";
import { StatusPill } from "@/lib/badges";

type Project = Tables<"projects"> & { adviseurs: { naam: string } | null; toegewezen_profiel?: { naam: string } | null; auditor_naam?: string | null };
type Finding = Tables<"findings"> & { projectnaam?: string; laatste_reactie?: string; laatste_bijlage?: string | null };

export default function Inbox() {
  const { user, roles, hasRole, actsAs, activeGroup } = useAuth();
  const location = useLocation();
  const navState = (location.state ?? {}) as { view?: string; tab?: string };
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFindings, setProjectFindings] = useState<Record<string, Finding[]>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [adviseurFindings, setAdviseurFindings] = useState<Finding[]>([]);
  const [adviseurFilterProject, setAdviseurFilterProject] = useState<string>("alle");
  const [adviseurFilterStatus, setAdviseurFilterStatus] = useState<string>("alle");
  const [adviseurProjecten, setAdviseurProjecten] = useState<{ id: string; projectnaam: string }[]>([]);
  const [zoekterm, setZoekterm] = useState("");
  const [toewijsbarePersonen, setToewijsbarePersonen] = useState<ToewijsbarePersoon[]>([]);
  const [isAdviseur, setIsAdviseur] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, roles]);

  const loadData = async () => {
    // Always check adviseur link (user may be in adviseurs table without ep_adviseur role)
    await loadAdviseurData();
    if (hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer")) await loadInternalData();
    if (hasRole("beheer")) await loadToewijsbarePersonen();
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

    // Bepaal voor afgeronde projecten de feitelijke auditor:
    // de beoordelaar van de meest recent goedgekeurde adviseur-zichtbare bevinding.
    if (hasRole("beheer") && loadedProjects.length > 0) {
      const afgerondIds = loadedProjects.filter(p => p.status === "afgerond").map(p => p.id);
      if (afgerondIds.length > 0) {
        const { data: afgerondFindings } = await supabase
          .from("findings")
          .select("project_id, toegewezen_beoordelaar, goedgekeurd_op")
          .in("project_id", afgerondIds)
          .eq("zichtbaar_voor_adviseur", true)
          .not("toegewezen_beoordelaar", "is", null)
          .order("goedgekeurd_op", { ascending: false });

        const auditorPerProject = new Map<string, string>();
        (afgerondFindings ?? []).forEach((f: any) => {
          if (!auditorPerProject.has(f.project_id) && f.toegewezen_beoordelaar) {
            auditorPerProject.set(f.project_id, f.toegewezen_beoordelaar);
          }
        });

        const auditorIds = [...new Set(auditorPerProject.values())];
        if (auditorIds.length > 0) {
          const { data: auditorProfiles } = await supabase.from("profiles").select("id, naam").in("id", auditorIds);
          const naamMap = new Map((auditorProfiles ?? []).map(p => [p.id, p.naam]));
          loadedProjects = loadedProjects.map(p => {
            if (p.status !== "afgerond") return p;
            const auditorId = auditorPerProject.get(p.id);
            return { ...p, auditor_naam: auditorId ? naamMap.get(auditorId) ?? null : null };
          });
        }
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
      const { data: findingData } = await supabase
        .from("findings")
        .select("*")
        .eq("toegewezen_beoordelaar", user!.id)
        .eq("status", "reactie_ontvangen");

      // Functiescheiding: eigen projecten als EP-adviseur nooit tonen om te beoordelen
      const { data: eigenAdviseur } = await supabase
        .from("adviseurs")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      let eigenProjectIds: string[] = [];
      if (eigenAdviseur) {
        const { data: eigenProjecten } = await supabase
          .from("projects")
          .select("id")
          .eq("adviseur_id", eigenAdviseur.id);
        eigenProjectIds = (eigenProjecten ?? []).map((p) => p.id);
      }
      setFindings((findingData ?? []).filter((f) => !eigenProjectIds.includes(f.project_id)));
    }
  };

  const loadAdviseurData = async () => {
    const { data: adviseurRecord } = await supabase
      .from("adviseurs")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!adviseurRecord) {
      setIsAdviseur(false);
      setAdviseurFindings([]);
      return;
    }
    setIsAdviseur(true);

    const { data: projectData } = await supabase
      .from("projects")
      .select("id, projectnaam")
      .eq("adviseur_id", adviseurRecord.id);

    setAdviseurProjecten(projectData ?? []);

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

  const loadToewijsbarePersonen = async () => {
    const { data: allProfiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    const { data: allCats } = await supabase.from("user_audit_categorieen").select("user_id, audit_categorie");
    const personen = (allProfiles ?? []).map(p => ({
      ...p,
      roles: (allRoles ?? []).filter(r => r.user_id === p.id).map(r => r.role),
      auditCategorieen: (allCats ?? []).filter(c => c.user_id === p.id).map(c => c.audit_categorie),
    })).filter(p => p.roles.includes("tekenaar") || p.roles.includes("auditor"));
    setToewijsbarePersonen(personen);
  };

  const hertoewijzen = async (projectId: string, nieuweUserId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const oudeUserId = project.toegewezen_aan;

    await supabase.from("projects").update({
      toegewezen_aan: nieuweUserId,
      toegewezen_op: new Date().toISOString(),
      toewijzing: "specifiek" as any,
    }).eq("id", projectId);

    // Openstaande bevindingen meeverhuizen naar de nieuwe behandelaar
    await supabase
      .from("findings")
      .update({ toegewezen_beoordelaar: nieuweUserId })
      .eq("project_id", projectId)
      .in("status", ["open", "reactie_ontvangen"] as any);

    const notificaties = [];
    if (oudeUserId && oudeUserId !== nieuweUserId) {
      notificaties.push({ user_id: oudeUserId, bericht: `Project "${project.projectnaam}" is aan je ontnomen en hertoegewezen.` });
    }
    notificaties.push({ user_id: nieuweUserId, bericht: `Project "${project.projectnaam}" is aan je toegewezen.` });
    await supabase.from("notificaties").insert(notificaties);

    toast.success("Project hertoegewezen");
    loadData();
  };

  const terugNaarPool = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const oudeUserId = project.toegewezen_aan;

    await supabase.from("projects").update({
      toegewezen_aan: null,
      toegewezen_op: null,
      toewijzing: "pool" as any,
    }).eq("id", projectId);

    if (oudeUserId) {
      await supabase.from("notificaties").insert({
        user_id: oudeUserId,
        bericht: `Project "${project.projectnaam}" is teruggeplaatst in de pool.`,
      });
    }

    toast.success("Project teruggeplaatst in pool");
    loadData();
  };

  const [substatusFilter, setSubstatusFilter] = useState<string>("alle");

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

    const grouped: Record<FaseKey, ProjectRow[]> = {} as any;
    orderedFases.forEach((f) => (grouped[f] = []));

    visible.forEach((p) => {
      const pFindings = projectFindings[p.id] ?? [];
      const hasReactie = pFindings.some((f) => f.status === "reactie_ontvangen");
      const fase = getProjectFase(p.status, hasReactie);
      grouped[fase].push({ ...p, _fase: fase } as ProjectRow);
    });

    return grouped;
  }, [projects, projectFindings, zoekterm]);

  const hoofdgroepen = useMemo(() => {
    const nieuw = projectenPerFase["nieuw"] ?? [];
    const bezig = bezigFases.flatMap(f => projectenPerFase[f] ?? []);
    const afgerond = projectenPerFase["afgerond"] ?? [];
    return { nieuw, bezig, afgerond };
  }, [projectenPerFase]);

  const filteredBezig = useMemo(() => {
    if (substatusFilter === "alle") return hoofdgroepen.bezig;
    return hoofdgroepen.bezig.filter(p => p._fase === substatusFilter);
  }, [hoofdgroepen.bezig, substatusFilter]);

  const totalVisible = hoofdgroepen.nieuw.length + hoofdgroepen.bezig.length + hoofdgroepen.afgerond.length;

  // Build available views based on roles
  const beschikbareWeergaven = useMemo(() => {
    const views: { key: string; label: string }[] = [];
    if (hasRole("beheer")) views.push({ key: "beheer", label: "Beheer" });
    if (hasRole("auditor")) views.push({ key: "medewerker", label: "Auditor" });
    else if (hasRole("tekenaar")) views.push({ key: "medewerker", label: "Tekenaar" });
    if (hasRole("ep_adviseur") || isAdviseur) views.push({ key: "ep_adviseur", label: "EP-adviseur" });
    return views;
  }, [roles, isAdviseur]);

  const adviseurStatusBadge = (status: string, hasConcept = false) => {
    if (status === "open" && hasConcept) {
      return <StatusPill label="Concept opgeslagen" tone="blue" />;
    }
    const map: Record<string, { label: string; tone: "orange" | "blue" | "green" }> = {
      open: { label: "Open", tone: "orange" },
      reactie_ontvangen: { label: "Reactie ingediend", tone: "blue" },
      reactie_goedgekeurd: { label: "Reactie goedgekeurd", tone: "green" },
    };
    const s = map[status];
    return s ? <StatusPill label={s.label} tone={s.tone} /> : <StatusPill label={status} />;
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

  const beheerOverzicht = (
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

      {/* Tellers strip */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { key: "nieuw", label: "Nieuw", count: hoofdgroepen.nieuw.length, icon: FolderKanban, accent: "text-muted-foreground" },
          { key: "bezig", label: "Bezig", count: hoofdgroepen.bezig.length, icon: Clock3, accent: "text-accent" },
          { key: "afgerond", label: "Afgerond", count: hoofdgroepen.afgerond.length, icon: CheckCircle2, accent: "text-primary" },
        ] as const).map((g, i) => (
          <div key={g.key} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-card border shadow-sm">
            <g.icon className={`h-3.5 w-3.5 ${g.accent}`} />
            <span className="text-muted-foreground">{i + 1}.</span>
            <span className="font-medium">{g.label}</span>
            <Badge variant={g.count > 0 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 ml-1">{g.count}</Badge>
          </div>
        ))}
      </div>

      {/* 3 collapsible groepen */}
      <div className="space-y-2">
        <FaseTabel
          fase="nieuw"
          faseIndex={0}
          projecten={hoofdgroepen.nieuw}
          canDelete={true}
          onDelete={deleteProject}
          defaultOpen={hoofdgroepen.nieuw.length > 0}
          showToewijzing={true}
          toewijsbarePersonen={toewijsbarePersonen}
          onReassign={hertoewijzen}
          onReturnToPool={terugNaarPool}
          titel="Nieuw"
          icon={FolderKanban}
          accentClass="text-muted-foreground"
        />

        <div className="space-y-1">
          <div className="flex items-center gap-2 pl-1">
            <Select value={substatusFilter} onValueChange={setSubstatusFilter}>
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder="Filter substatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle substatussen</SelectItem>
                {bezigFases.map(f => (
                  <SelectItem key={f} value={f}>{faseConfig[f].titel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FaseTabel
            fase="deel1_bezig"
            faseIndex={1}
            projecten={filteredBezig}
            canDelete={true}
            onDelete={deleteProject}
            defaultOpen={hoofdgroepen.bezig.length > 0}
            showToewijzing={true}
            showSubstatus
            inlineToewijzing
            toewijsbarePersonen={toewijsbarePersonen}
            onReassign={hertoewijzen}
            onReturnToPool={terugNaarPool}
            titel="Bezig"
            icon={Clock3}
            accentClass="text-accent"
            badge={hoofdgroepen.bezig.length}
          />
        </div>

        <FaseTabel
          fase="afgerond"
          faseIndex={2}
          projecten={hoofdgroepen.afgerond}
          canDelete={true}
          onDelete={deleteProject}
          defaultOpen={hoofdgroepen.afgerond.length > 0}
          showToewijzing={true}
          toewijsbarePersonen={toewijsbarePersonen}
          onReassign={hertoewijzen}
          onReturnToPool={terugNaarPool}
          titel="Afgerond"
          icon={CheckCircle2}
          accentClass="text-primary"
          isAfgerondView
        />
      </div>
    </>
  );

  const beheerTab = ["overzicht", "toewijzingen", "exports", "foutenanalyse"].includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as string)
    : "overzicht";

  const beheerContent = (
    <Tabs
      value={beheerTab}
      onValueChange={(v) => setSearchParams(v === "overzicht" ? {} : { tab: v }, { replace: true })}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="overzicht" className="gap-1.5">
          <FolderKanban className="h-3.5 w-3.5" /> Overzicht
        </TabsTrigger>
        <TabsTrigger value="toewijzingen" className="gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Toewijzingen
        </TabsTrigger>
        <TabsTrigger value="exports" className="gap-1.5">
          <FileDown className="h-3.5 w-3.5" /> Exports
        </TabsTrigger>
        <TabsTrigger value="foutenanalyse" className="gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" /> Foutenanalyse
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overzicht" className="space-y-6">{beheerOverzicht}</TabsContent>
      <TabsContent value="toewijzingen" className="space-y-4">
        <ToewijzingenBeheer />
      </TabsContent>
      <TabsContent value="exports" className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Twee soorten downloads: <strong>Alle projecten</strong> voor één CSV met eigen filters, en
          <strong> Bulk PDF</strong> voor de volledige auditformulieren als PDF in één ZIP-bestand.
        </p>
        <AlleProjectenExport />
        <BulkPdfExport />
      </TabsContent>
      <TabsContent value="foutenanalyse" className="space-y-4">
        <FoutenAnalyse />
      </TabsContent>
    </Tabs>
  );



  const adviseurContent = (
    <Tabs key={navState.tab ?? "projecten"} defaultValue={navState.tab === "overzicht" ? "overzicht" : "projecten"} className="space-y-4">
      <NieuwOverzichtMelding />
      <TabsList>
        <TabsTrigger value="projecten">Projecten</TabsTrigger>
        <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
      </TabsList>
      <TabsContent value="projecten" className="space-y-4">
        <AdviseurSectie
        filteredAdviseurFindings={filteredAdviseurFindings}
        adviseurFilterProject={adviseurFilterProject}
        setAdviseurFilterProject={setAdviseurFilterProject}
        adviseurFilterStatus={adviseurFilterStatus}
        setAdviseurFilterStatus={setAdviseurFilterStatus}
        adviseurProjectNames={adviseurProjectNames}
        adviseurStatusBadge={adviseurStatusBadge}
        handleDownload={handleDownload}
        adviseurProjecten={adviseurProjecten}
          onAdviseurDataChanged={loadAdviseurData}
        />
      </TabsContent>
      <TabsContent value="overzicht">
        <AdviseurOverzicht />
      </TabsContent>
    </Tabs>
  );

  const medewerkerContent = <MedewerkerDashboard />;

  const actieveWeergave = activeGroup ?? beschikbareWeergaven[0]?.key ?? null;
  const actieveLabel =
    beschikbareWeergaven.find((v) =>
      actieveWeergave === "medewerker" ? v.key === "medewerker" : v.key === actieveWeergave
    )?.label ?? (roles.join(", ") || "geen rol");

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {actieveWeergave === "ep_adviseur" && navState.tab === "overzicht" ? "Overzicht" : "Projecten"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {actieveWeergave === "beheer" ? `${totalVisible} actieve projecten · ` : ""}
              {actieveLabel}
            </p>
          </div>
        </div>
        {actsAs("beheer") && (
          <Link to="/project/nieuw">
            <Button size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Nieuw project
            </Button>
          </Link>
        )}
      </div>

      {actieveWeergave === "beheer" && hasRole("beheer") && beheerContent}
      {actieveWeergave === "medewerker" && (hasRole("auditor") || hasRole("tekenaar")) && medewerkerContent}
      {actieveWeergave === "ep_adviseur" && (hasRole("ep_adviseur") || isAdviseur) && adviseurContent}

      {projects.length === 0 && findings.length === 0 && adviseurFindings.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Geen openstaande items.</p>
      )}
    </div>
  );
}