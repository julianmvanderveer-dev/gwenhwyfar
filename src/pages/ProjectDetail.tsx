import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { addMonths, addDays } from "date-fns";
import FindingToelichting from "@/components/FindingToelichting";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { statusBadge, beoordelingBadge, afwijkingBadge } from "@/lib/badges";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { generateAuditReport } from "@/lib/generateAuditReport";
import AandachtspuntenAdviseur from "@/components/projecten/AandachtspuntenAdviseur";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;
type Template = { id: string; code: string; onderdeel: string; controlepunt: string; deel: number };

// A merged row: template + optional existing finding
type MergedRow = Template & { finding?: Finding };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [ep2Start, setEp2Start] = useState<string>("");
  const [ep2Eind, setEp2Eind] = useState<string>("");
  const [ep2Beoordeling, setEp2Beoordeling] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    loadProject().then((p) => {
      if (p) {
        autoSetStatus(p.status);
        loadTemplates(p.audit_categorie);
      }
    });
    loadFindings();
  }, [id]);

  useEffect(() => {
    if (project) {
      setEp2Start(project.ep2_startwaarde?.toString() ?? "");
      setEp2Eind(project.ep2_eindwaarde?.toString() ?? "");
      setEp2Beoordeling(project.ep2_beoordeling ?? "");
    }
  }, [project]);

  const loadProject = async () => {
    const { data } = await supabase.from("projects").select("*").eq("id", id!).single();
    setProject(data);
    return data;
  };

  const autoSetStatus = async (currentStatus: string) => {
    if (hasRole("tekenaar") && currentStatus === "nog_niet_begonnen") {
      // Probeer atomisch te claimen bij pool-projecten
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel1_bezig" as any }).eq("id", id!);
      loadProject();
    } else if (hasRole("auditor") && currentStatus === "deel1_afgerond") {
      // Probeer atomisch te claimen bij pool-projecten
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel2_bezig" as any }).eq("id", id!);
      loadProject();
    }
  };

  const loadTemplates = async (categorie: string) => {
    const { data } = await supabase
      .from("checklist_templates")
      .select("id, code, onderdeel, controlepunt, deel")
      .eq("audit_categorie", categorie as any)
      .order("onderdeel")
      .order("code");
    setTemplates((data as Template[]) ?? []);
  };

  const loadFindings = async () => {
    const { data } = await supabase
      .from("findings")
      .select("*")
      .eq("project_id", id!)
      .order("created_at");
    setFindings((data as Finding[]) ?? []);
  };

  // Create a finding on-the-fly when a user sets a beoordeling on a template row without an existing finding
  const ensureFinding = async (template: Template): Promise<string> => {
    // Check if finding already exists
    const existing = findings.find(
      (f) => f.onderdeel === template.onderdeel && f.controlepunt === template.controlepunt && f.deel === template.deel
    );
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("findings")
      .insert({
        project_id: id!,
        onderdeel: template.onderdeel,
        controlepunt: template.controlepunt,
        deel: template.deel,
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
      throw error;
    }
    return data!.id;
  };

  const updateBeoordeling = async (findingId: string, beoordeling: Enums<"beoordeling_type">) => {
    const update: any = { beoordeling };
    if (beoordeling === "niet_goed") {
      update.type_afwijking = "niet_kritiek";
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
    } else if (beoordeling === "opmerking") {
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
    }
    await supabase.from("findings").update(update).eq("id", findingId);
    loadFindings();
  };

  const handleBeoordeling = async (row: MergedRow, beoordeling: string) => {
    try {
      const fId = row.finding?.id ?? (await ensureFinding(row));
      if (!beoordeling) {
        // Clear beoordeling
        await supabase.from("findings").update({ beoordeling: null, type_afwijking: null } as any).eq("id", fId);
        loadFindings();
      } else {
        await updateBeoordeling(fId, beoordeling as Enums<"beoordeling_type">);
      }
    } catch {
      // error already toasted
    }
  };

  const updateAfwijkingType = async (findingId: string, type: Enums<"afwijking_type">) => {
    await supabase.from("findings").update({ type_afwijking: type }).eq("id", findingId);
    loadFindings();
  };

  const allesGoedkeuren = async (onderdeel: string) => {
    // First ensure all template rows for this onderdeel have findings
    const onderdeelTemplates = templates.filter((t) => t.onderdeel === onderdeel);
    for (const t of onderdeelTemplates) {
      const existing = findings.find(
        (f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel
      );
      if (!existing && canEditTemplate(t)) {
        await ensureFinding(t);
      }
    }
    await loadFindings();
    // Now update all to goed
    const { data: currentFindings } = await supabase
      .from("findings")
      .select("id, onderdeel, deel, beoordeling")
      .eq("project_id", id!)
      .eq("onderdeel", onderdeel);
    const ids = (currentFindings ?? [])
      .filter((f) => canEditFindingByDeel(f.deel) && f.beoordeling !== "goed")
      .map((f) => f.id);
    if (ids.length === 0) return;
    await supabase.from("findings").update({ beoordeling: "goed" as any }).in("id", ids);
    toast({ title: "Alles goedgekeurd", description: `${ids.length} post(en) op goed gezet.` });
    loadFindings();
  };

  const deel1Afronden = async () => {
    await supabase.from("projects").update({ status: "deel1_afgerond" as any }).eq("id", id!);
    toast({ title: "Deel 1 afgerond", description: "Status gewijzigd naar 'Deel 1 afgerond'" });
    loadProject();
  };

  const auditAfronden = async () => {
    const now = new Date();
    const nietGoedFindings = findings.filter(f => f.beoordeling === "niet_goed");
    const opmerkingFindings = findings.filter(f => f.beoordeling === "opmerking");
    const hasKt = nietGoedFindings.some(f => f.type_afwijking === "kritiek");

    const kritiekIds = nietGoedFindings.filter(f => f.type_afwijking === "kritiek").map(f => f.id);
    const nietKritiekIds = nietGoedFindings.filter(f => f.type_afwijking !== "kritiek").map(f => f.id);

    await Promise.all([
      kritiekIds.length > 0 && supabase.from("findings").update({
        deadline: addDays(now, 28).toISOString(),
        zichtbaar_voor_adviseur: true,
        status: "open" as any,
      }).in("id", kritiekIds),

      nietKritiekIds.length > 0 && supabase.from("findings").update({
        deadline: addMonths(now, 3).toISOString(),
        zichtbaar_voor_adviseur: true,
        status: "open" as any,
      }).in("id", nietKritiekIds),

      opmerkingFindings.length > 0 && supabase.from("findings").update({
        zichtbaar_voor_adviseur: true,
      }).in("id", opmerkingFindings.map(f => f.id)),
    ].filter(Boolean));

    const hasNietGoed = nietGoedFindings.length > 0;

    if (hasNietGoed) {
      const now2 = new Date();
      const reactieDeadline = hasKt ? addDays(now2, 28).toISOString() : addMonths(now2, 3).toISOString();
      await supabase.from("projects").update({
        status: "wacht_op_reactie" as any,
        reactie_deadline: reactieDeadline,
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Status naar 'Wacht op reactie', deadline berekend" });
    } else {
      await supabase.from("projects").update({
        status: "afgerond" as any,
        gearchiveerd_op: new Date().toISOString(),
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Geen afwijkingen, status naar 'Afgerond'" });
    }

    supabase.functions.invoke("notify-adviseur", {
      body: { type: "audit_afgerond", project_id: id },
    }).then(({ error }) => {
      if (error) console.error("Notificatie fout:", error);
    });

    loadProject();
    loadFindings();
  };

  const saveEp2 = async () => {
    const update: any = {
      ep2_startwaarde: ep2Start ? parseFloat(ep2Start) : null,
      ep2_eindwaarde: ep2Eind ? parseFloat(ep2Eind) : null,
      ep2_beoordeling: ep2Beoordeling || null,
    };
    await supabase.from("projects").update(update).eq("id", id!);
    toast({ title: "EP2 opgeslagen" });
    loadProject();
  };

  if (!project) return <div className="p-6 text-muted-foreground">Laden...</div>;

  // Build merged rows per onderdeel
  const onderdelen = [...new Set(templates.map((t) => t.onderdeel))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const allTabs = [...onderdelen, "__ep2__"];

  const canDeel1 = hasRole("tekenaar") && (project.status === "nog_niet_begonnen" || project.status === "deel1_bezig");
  const canDeel2 = hasRole("auditor") && (project.status === "deel1_afgerond" || project.status === "deel2_bezig");

  const canEditFindingByDeel = (deel: number) => {
    if (canDeel1 && deel === 1) return true;
    if (canDeel2 && deel === 2) return true;
    return false;
  };

  const canEditFinding = (f: Finding) => canEditFindingByDeel(f.deel);
  const canEditTemplate = (t: Template) => canEditFindingByDeel(t.deel);
  const canEditAny = canDeel1 || canDeel2;

  const getMergedRows = (onderdeel: string): MergedRow[] => {
    const onderdeelTemplates = templates
      .filter((t) => t.onderdeel === onderdeel)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return onderdeelTemplates.map((t) => {
      const finding = findings.find(
        (f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel
      );
      return { ...t, finding };
    });
  };

  const currentIndex = allTabs.indexOf(activeTab);
  const goTo = (dir: -1 | 1) => {
    const next = allTabs[currentIndex + dir];
    if (next) setActiveTab(next);
  };

  const statusLabel: Record<string, string> = {
    nog_niet_begonnen: "Nog niet begonnen",
    deel1_bezig: "Deel 1 bezig",
    deel1_afgerond: "Deel 1 afgerond",
    deel2_bezig: "Deel 2 bezig",
    afgerond: "Afgerond",
    wacht_op_reactie: "Reactie EP-adviseur gevraagd",
    gesloten: "Gesloten",
  };

  // EP2 berekeningen
  const startVal = parseFloat(ep2Start);
  const eindVal = parseFloat(ep2Eind);
  const afwijkingAbs = !isNaN(startVal) && !isNaN(eindVal) ? eindVal - startVal : null;
  const afwijkingPct = afwijkingAbs !== null && startVal !== 0 ? (afwijkingAbs / startVal) * 100 : null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{project.projectnaam}</h1>
          <p className="text-xs text-muted-foreground">
            {project.audit_categorie} · {project.audit_soort}
            {project.toelatingsaudit && " · Toelatingsaudit"}
            {project.prioriteit && " · Prioriteit"}
          </p>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-2">
          {(hasRole("beheer") || hasRole("ep_adviseur")) &&
            ["afgerond", "gesloten", "wacht_op_reactie"].includes(project.status) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  let adviseurNaam: string | undefined;
                  if (project.adviseur_id) {
                    const { data } = await supabase
                      .from("adviseurs")
                      .select("naam")
                      .eq("id", project.adviseur_id)
                      .single();
                    adviseurNaam = data?.naam;
                  }
                  generateAuditReport({ project, findings, adviseurNaam, templates });
                }}
              >
                <Download className="h-4 w-4" />
                Download rapport
              </Button>
            )}
          {statusBadge(project.status)}
        </div>
      </div>

      {/* Aandachtspunten adviseur */}
      {project.adviseur_id && (
        <AandachtspuntenAdviseur adviseurId={project.adviseur_id} projectId={project.id} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab || onderdelen[0] || "__ep2__"} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {onderdelen.map((o) => (
            <TabsTrigger key={o} value={o} className="text-xs">{o}</TabsTrigger>
          ))}
          <TabsTrigger value="__ep2__" className="text-xs">EP2 Beoordeling</TabsTrigger>
        </TabsList>

        {onderdelen.map((o) => {
          const rows = getMergedRows(o);
          return (
            <TabsContent key={o} value={o} className="space-y-3">
              {canEditAny && rows.length > 0 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm gap-1.5"
                    onClick={() => allesGoedkeuren(o)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Alles goedkeuren
                  </Button>
                </div>
              )}
              <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/60">
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Code</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                      <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Deel</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Beoordeling</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Deadline</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const f = row.finding;
                      const editable = canEditTemplate(row);
                      return (
                        <React.Fragment key={row.id}>
                          <tr className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 !== 0 ? 'bg-muted/20' : ''}`}>
                            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.code}</td>
                            <td className="px-4 py-2.5 font-medium">{row.controlepunt}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${row.deel === 1 ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                                {row.deel}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {editable ? (
                                <select
                                  className="border border-input rounded-md px-2 py-1 text-sm bg-background"
                                  value={f?.beoordeling ?? ""}
                                  onChange={(e) => handleBeoordeling(row, e.target.value)}
                                >
                                  <option value="">—</option>
                                  <option value="goed">Goed</option>
                                  <option value="niet_goed">Niet goed</option>
                                  <option value="opmerking">Opmerking</option>
                                </select>
                              ) : (
                                f?.beoordeling ? beoordelingBadge(f.beoordeling) : <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {f && editable && f.beoordeling === "niet_goed" ? (
                                <select
                                  className="border border-input rounded-md px-2 py-1 text-sm bg-background"
                                  value={f.type_afwijking ?? ""}
                                  onChange={(e) => updateAfwijkingType(f.id, e.target.value as any)}
                                >
                                  <option value="kritiek">Kritiek</option>
                                  <option value="niet_kritiek">Niet kritiek</option>
                                </select>
                              ) : (
                                f?.type_afwijking ? afwijkingBadge(f.type_afwijking) : <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground text-xs">
                              {f?.deadline ? new Date(f.deadline).toLocaleDateString("nl-NL") : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-xs">
                              {f ? statusBadge(f.status) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                          {f && ((editable && (f.beoordeling === "niet_goed" || f.beoordeling === "opmerking")) || f.toelichting) && (
                            <tr className="border-b bg-muted/30">
                              <td colSpan={7} className="px-4 pb-2 pt-1">
                                <FindingToelichting
                                  findingId={f.id}
                                  initialValue={f.toelichting}
                                  editable={editable}
                                />
                                {editable && f.beoordeling === "niet_goed" && (
                                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-muted-foreground">
                                    <Checkbox
                                      checked={f.upload_vereist}
                                      onCheckedChange={async (checked) => {
                                        const { error } = await supabase
                                          .from("findings")
                                          .update({ upload_vereist: !!checked })
                                          .eq("id", f.id);
                                        if (error) {
                                          toast({ title: "Fout", description: "Kon upload-eis niet opslaan", variant: "destructive" });
                                        } else {
                                          setFindings((prev) =>
                                            prev.map((fin) => fin.id === f.id ? { ...fin, upload_vereist: !!checked } : fin)
                                          );
                                        }
                                      }}
                                    />
                                    Upload vereist voor EP-adviseur
                                  </label>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Navigation */}
              <div className="flex justify-between">
                {allTabs.indexOf(o) > 0 ? (
                  <Button variant="outline" size="sm" onClick={() => goTo(-1)} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Vorige
                  </Button>
                ) : <div />}
                {allTabs.indexOf(o) < allTabs.length - 1 && (
                  <Button variant="outline" size="sm" onClick={() => goTo(1)} className="gap-1">
                    Volgende <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TabsContent>
          );
        })}

        {/* EP2 Tab */}
        <TabsContent value="__ep2__" className="space-y-4">
          <div className="border rounded-lg shadow-sm bg-card p-6 space-y-5 max-w-lg">
            <h2 className="text-lg font-semibold tracking-tight">EP2 Beoordeling</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Startwaarde EP2 (kWh/m²)</label>
              <Input
                type="number"
                step="0.01"
                value={ep2Start}
                onChange={(e) => setEp2Start(e.target.value)}
                disabled={!canDeel2}
                placeholder="bijv. 125.50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Eindwaarde EP2 (kWh/m²)</label>
              <Input
                type="number"
                step="0.01"
                value={ep2Eind}
                onChange={(e) => setEp2Eind(e.target.value)}
                disabled={!canDeel2}
                placeholder="bijv. 130.00"
              />
            </div>

            {afwijkingAbs !== null && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Afwijking absoluut</span>
                  <p className="font-semibold mt-0.5">{afwijkingAbs.toFixed(2)} kWh/m²</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Afwijking %</span>
                  <p className="font-semibold mt-0.5">{afwijkingPct !== null ? afwijkingPct.toFixed(1) + "%" : "—"}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Beoordeling</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={ep2Beoordeling}
                onChange={(e) => setEp2Beoordeling(e.target.value)}
                disabled={!canDeel2}
              >
                <option value="">— Selecteer —</option>
                <option value="goed">GOED</option>
                <option value="niet_kritiek">NK (Niet kritiek)</option>
                <option value="kritiek">KT (Kritiek)</option>
              </select>
            </div>

            {canDeel2 && (
              <Button onClick={saveEp2} size="sm" className="shadow-sm">
                EP2 opslaan
              </Button>
            )}
          </div>
          <div className="flex justify-between">
            {currentIndex > 0 ? (
              <Button variant="outline" size="sm" onClick={() => goTo(-1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Vorige
              </Button>
            ) : <div />}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      {(canDeel1 || canDeel2) && (
        <div className="border rounded-lg bg-card p-4 flex items-center gap-3 shadow-sm">
          {canDeel1 && (
            <Button onClick={deel1Afronden} className="shadow-sm">Deel 1 afronden</Button>
          )}
          {canDeel2 && (
            <Button onClick={auditAfronden} className="shadow-sm">Audit afronden</Button>
          )}
        </div>
      )}
    </div>
  );
}
