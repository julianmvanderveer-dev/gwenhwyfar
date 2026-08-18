import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  FolderOpen,
  Inbox,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AfgerondeAudits from "@/components/dashboard/AfgerondeAudits";

interface FindingRow {
  id: string;
  controlepunt: string;
  onderdeel: string;
  project_id: string;
  projectnaam: string;
  adviseur_naam: string;
  reactie_tekst: string | null;
  reactie_datum: string | null;
  concept_beoordeling: { type?: string } | null;
}

interface ProjectGroep {
  project_id: string;
  projectnaam: string;
  adviseur_naam: string;
  findings: FindingRow[];
  totaal: number;
  conceptKlaar: number;
  akkoordCount: number;
  nietAkkoordCount: number;
  laatsteReactie: string | null;
}

interface MijnProject {
  id: string;
  projectnaam: string;
  audit_categorie: string;
  status: string;
  toewijzing: string;
  toegewezen_aan: string | null;
  hasReactieOntvangen?: boolean;
}

export default function MedewerkerDashboard() {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const navState = (location.state ?? {}) as { tab?: string };
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
      .select("id, controlepunt, onderdeel, project_id, concept_beoordeling")
      .eq("toegewezen_beoordelaar", user!.id)
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
        concept_beoordeling: (f as any).concept_beoordeling ?? null,
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
    // Safety net: projects with active status but no toegewezen_aan that are visible via RLS
    // should be treated as "assigned to me" (they came through RLS so they're mine or pool)
    const ACTIVE_STATUSES = ["deel1_bezig", "deel1_afgerond", "deel2_bezig", "wacht_op_reactie"];
    let filtered = (data ?? []).filter(
      (p) =>
        p.toegewezen_aan === user!.id ||
        (p.toewijzing === "pool" && !p.toegewezen_aan) ||
        (!p.toegewezen_aan && ACTIVE_STATUSES.includes(p.status))
    );

    // Role-based visibility filter
    if (eigenaarRol === "auditor") {
      filtered = filtered.filter(
        (p) => !["nog_niet_begonnen", "deel1_bezig"].includes(p.status)
      );
    }

    const projectIds = filtered.map((p) => p.id);
    const { data: reactieFindings } = projectIds.length > 0
      ? await supabase
          .from("findings")
          .select("project_id")
          .in("project_id", projectIds)
          .eq("status", "reactie_ontvangen")
      : { data: [] };

    const projectenMetReactie = new Set((reactieFindings ?? []).map((f) => f.project_id));
    setProjecten(filtered.map((p) => ({ ...p, hasReactieOntvangen: projectenMetReactie.has(p.id) })));
  };

  const getStatusInfo = (status: string, rol: string, hasReactieOntvangen = false) => {
    if (status === "wacht_op_reactie" && hasReactieOntvangen) {
      return { label: "Reacties beoordelen", clickable: false };
    }

    if (rol === "tekenaar") {
      switch (status) {
        case "nog_niet_begonnen": return { label: "Starten", clickable: true, variant: "default" };
        case "deel1_bezig": return { label: "Verder gaan", clickable: true, variant: "default" };
        case "deel1_afgerond":
        case "deel2_bezig": return { label: "Bij auditor", clickable: false };
        case "wacht_op_reactie": return { label: "Reactie EP-adviseur gevraagd", clickable: false };
        default: return { label: status, clickable: false };
      }
    } else {
      // auditor
      switch (status) {
        case "deel1_afgerond": return { label: "Starten", clickable: true, variant: "default" };
        case "deel2_bezig": return { label: "Verder gaan", clickable: true, variant: "default" };
        case "wacht_op_reactie": return { label: "Reactie EP-adviseur gevraagd", clickable: false };
        default: return { label: status, clickable: false };
      }
    }
  };

  const truncate = (text: string, max = 80) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  const projectGroepen: ProjectGroep[] = (() => {
    const map = new Map<string, ProjectGroep>();
    for (const f of findings) {
      let g = map.get(f.project_id);
      if (!g) {
        g = {
          project_id: f.project_id,
          projectnaam: f.projectnaam,
          adviseur_naam: f.adviseur_naam,
          findings: [],
          totaal: 0,
          conceptKlaar: 0,
          akkoordCount: 0,
          nietAkkoordCount: 0,
          laatsteReactie: null,
        };
        map.set(f.project_id, g);
      }
      g.findings.push(f);
      g.totaal += 1;
      if (f.concept_beoordeling) {
        g.conceptKlaar += 1;
        if (f.concept_beoordeling.type === "akkoord") g.akkoordCount += 1;
        else if (f.concept_beoordeling.type === "niet_akkoord") g.nietAkkoordCount += 1;
      }
      if (f.reactie_datum && (!g.laatsteReactie || f.reactie_datum > g.laatsteReactie)) {
        g.laatsteReactie = f.reactie_datum;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (!a.laatsteReactie && !b.laatsteReactie) return a.projectnaam.localeCompare(b.projectnaam);
      if (!a.laatsteReactie) return 1;
      if (!b.laatsteReactie) return -1;
      return b.laatsteReactie.localeCompare(a.laatsteReactie);
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Laden…
      </div>
    );
  }

  return (
    <Tabs defaultValue={navState.tab === "projecten" ? "projecten" : "findings"} className="space-y-4">
      <TabsList>
        <TabsTrigger value="findings" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Bevindingen
          {projectGroepen.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
              {projectGroepen.length}
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
        {projectGroepen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Er zijn momenteel geen openstaande bevindingen.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projectGroepen.map((g) => {
              const klaar = g.conceptKlaar === g.totaal;
              return (
                <Collapsible key={g.project_id} defaultOpen={projectGroepen.length === 1}>
                  <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors group"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{g.projectnaam}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {g.adviseur_naam}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {g.totaal} reactie{g.totaal === 1 ? "" : "s"} te beoordelen
                            {g.laatsteReactie && (
                              <span className="ml-2">
                                · laatste {new Date(g.laatsteReactie).toLocaleDateString("nl-NL")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Badge
                            variant={klaar ? "default" : "outline"}
                            className={`text-xs ${klaar ? "bg-emerald-600 hover:bg-emerald-600" : ""}`}
                          >
                            {g.conceptKlaar}/{g.totaal} beoordeeld
                          </Badge>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-background/40">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-secondary/40">
                              <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Onderdeel / controlepunt</th>
                              <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Reactie EP-adviseur</th>
                              <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Datum</th>
                              <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                              <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Actie</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.findings.map((f, i) => {
                              const c = f.concept_beoordeling;
                              const conceptStatus = !c ? null : c.type === "akkoord" ? "akkoord" : "niet_akkoord";
                              return (
                                <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                                  <td className="px-4 py-2.5">
                                    <div className="font-medium">{f.controlepunt}</div>
                                    <div className="text-xs text-muted-foreground">{f.onderdeel}</div>
                                  </td>
                                  <td className="px-4 py-2.5 text-muted-foreground max-w-md">
                                    {f.reactie_tekst ? truncate(f.reactie_tekst, 100) : <span className="italic">Geen bericht</span>}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                    {f.reactie_datum ? new Date(f.reactie_datum).toLocaleDateString("nl-NL") : "—"}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {conceptStatus === "akkoord" ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Concept goedgekeurd
                                      </span>
                                    ) : conceptStatus === "niet_akkoord" ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                        <XCircle className="h-3.5 w-3.5" /> Concept niet akkoord
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                        <Circle className="h-3.5 w-3.5" /> Nog beoordelen
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Link to={`/finding/${f.id}/beoordeling`} className="text-primary hover:underline font-medium text-sm">
                                      Open
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-muted/20 border-t">
                          <Link to={`/project/${g.project_id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              Naar projectoverzicht
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* ─── Mijn projecten ─── */}
      <TabsContent value="projecten" className="space-y-6">
        <div className="flex justify-end">
          <Link to="/project/nieuw">
            <Button size="sm" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Nieuw project
            </Button>
          </Link>
        </div>
        {(() => {
          const ACTIVE_STATUSES = ["deel1_bezig", "deel1_afgerond", "deel2_bezig", "wacht_op_reactie"];
          const assigned = projecten.filter(
            (p) => p.toegewezen_aan === user!.id || (!p.toegewezen_aan && ACTIVE_STATUSES.includes(p.status))
          );
          const pool = projecten.filter((p) => p.toewijzing === "pool" && !p.toegewezen_aan && !ACTIVE_STATUSES.includes(p.status));

          const renderTable = (items: MijnProject[]) => (
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Projectnaam</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => {
                    const statusInfo = getStatusInfo(p.status, eigenaarRol, p.hasReactieOntvangen);
                    return (
                      <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                        <td className="px-4 py-2.5 font-medium">
                          <Link to={`/project/${p.id}`} className="text-primary hover:underline">
                            {p.projectnaam}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className="text-xs">{p.audit_categorie}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {statusInfo.clickable ? (
                            <Link to={`/project/${p.id}`}>
                              <Button size="sm" variant={statusInfo.variant as any} className="h-7 text-xs">
                                {statusInfo.label}
                              </Button>
                            </Link>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );

          return (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Aan mij toegewezen</h3>
                {assigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Geen toegewezen projecten.</p>
                ) : renderTable(assigned)}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 text-foreground">Beschikbaar in pool</h3>
                {pool.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Geen beschikbare projecten in de pool.</p>
                ) : renderTable(pool)}
              </div>
            </>
          );
        })()}
        <AfgerondeAudits />
      </TabsContent>
    </Tabs>
  );
}
