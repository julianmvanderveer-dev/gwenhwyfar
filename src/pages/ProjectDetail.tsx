import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { addMonths, addDays } from "date-fns";
import FindingToelichting from "@/components/FindingToelichting";
import { Input } from "@/components/ui/input";

type Project = Tables<"projects">;
type Finding = Tables<"findings"> & { deel?: number; toelichting?: string | null };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [ep2Start, setEp2Start] = useState<string>("");
  const [ep2Eind, setEp2Eind] = useState<string>("");
  const [ep2Beoordeling, setEp2Beoordeling] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    loadProject();
    loadFindings();
  }, [id]);

  useEffect(() => {
    if (project) {
      setEp2Start((project as any).ep2_startwaarde?.toString() ?? "");
      setEp2Eind((project as any).ep2_eindwaarde?.toString() ?? "");
      setEp2Beoordeling((project as any).ep2_beoordeling ?? "");
    }
  }, [project]);

  const loadProject = async () => {
    const { data } = await supabase.from("projects").select("*").eq("id", id!).single();
    setProject(data);
  };

  const loadFindings = async () => {
    const { data } = await supabase
      .from("findings")
      .select("*")
      .eq("project_id", id!)
      .order("created_at");
    setFindings((data as Finding[]) ?? []);
  };

  const updateBeoordeling = async (findingId: string, beoordeling: Enums<"beoordeling_type">) => {
    const update: any = { beoordeling };
    if (beoordeling === "niet_goed") {
      update.type_afwijking = "niet_kritiek";
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
    } else if (beoordeling === "interne_alert") {
      update.type_afwijking = "kritiek";
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
    }
    await supabase.from("findings").update(update).eq("id", findingId);
    loadFindings();
  };

  const updateAfwijkingType = async (findingId: string, type: Enums<"afwijking_type">) => {
    await supabase.from("findings").update({ type_afwijking: type }).eq("id", findingId);
    loadFindings();
  };

  const allesGoedkeuren = async (onderdeel: string) => {
    const ids = findings
      .filter((f) => f.onderdeel === onderdeel && canEditFinding(f) && f.beoordeling !== "goed")
      .map((f) => f.id);
    if (ids.length === 0) return;
    await supabase.from("findings").update({ beoordeling: "goed" as any }).in("id", ids);
    toast({ title: "Alles goedgekeurd", description: `${ids.length} finding(s) op goed gezet.` });
    loadFindings();
  };

  const deel1Afronden = async () => {
    await supabase.from("projects").update({ status: "wacht_op_deel2" as any }).eq("id", id!);
    toast({ title: "Deel 1 afgerond", description: "Status gewijzigd naar 'Wacht op deel 2'" });
    loadProject();
  };

  const auditAfronden = async () => {
    const now = new Date();
    for (const f of findings) {
      if (f.beoordeling === "niet_goed" || f.beoordeling === "interne_alert") {
        const deadline = f.type_afwijking === "kritiek"
          ? addDays(now, 28).toISOString()
          : addMonths(now, 3).toISOString();
        await supabase.from("findings").update({
          deadline,
          zichtbaar_voor_adviseur: true,
          status: "open" as any,
        }).eq("id", f.id);
      }
    }
    await supabase.from("projects").update({ status: "reactie_open" as any }).eq("id", id!);
    toast({ title: "Audit afgerond", description: "Deadlines berekend, status naar 'Reactie open'" });

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

  if (!project) return <div className="p-4">Laden...</div>;

  const onderdelen = [...new Set(findings.map((f) => f.onderdeel))];
  const canDeel1 = hasRole("tekenaar") && (project.status === "geselecteerd" || project.status === "deel1_bezig");
  const canDeel2 = hasRole("auditor") && project.status === "wacht_op_deel2";

  const canEditFinding = (f: Finding) => {
    if (canDeel1 && f.deel === 1) return true;
    if (canDeel2 && f.deel === 2) return true;
    return false;
  };

  const canEditAny = canDeel1 || canDeel2;

  const statusLabel: Record<string, string> = {
    geselecteerd: "Geselecteerd",
    deel1_bezig: "Deel 1 bezig",
    wacht_op_deel2: "Wacht op deel 2",
    afgerond: "Afgerond",
    reactie_open: "Reactie open",
    gesloten: "Gesloten",
  };

  // EP2 berekeningen
  const startVal = parseFloat(ep2Start);
  const eindVal = parseFloat(ep2Eind);
  const afwijkingAbs = !isNaN(startVal) && !isNaN(eindVal) ? eindVal - startVal : null;
  const afwijkingPct = afwijkingAbs !== null && startVal !== 0 ? (afwijkingAbs / startVal) * 100 : null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-1">{project.projectnaam}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Status: {statusLabel[project.status]} | Categorie: {project.audit_categorie} | Soort: {project.audit_soort} | {project.toelatingsaudit && "Toelatingsaudit | "}Prioriteit: {project.prioriteit ? "Ja" : "Nee"}
      </p>

      {onderdelen.length > 0 ? (
        <Tabs defaultValue={onderdelen[0]}>
          <TabsList className="flex-wrap h-auto">
            {onderdelen.map((o) => (
              <TabsTrigger key={o} value={o}>{o}</TabsTrigger>
            ))}
            <TabsTrigger value="__ep2__">EP2 Beoordeling</TabsTrigger>
          </TabsList>

          {onderdelen.map((o) => (
            <TabsContent key={o} value={o}>
              {canEditAny && (
                <div className="mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => allesGoedkeuren(o)}
                  >
                    Alles goedkeuren
                  </Button>
                </div>
              )}
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left p-2">Controlepunt</th>
                    <th className="text-left p-2 w-20">Deel</th>
                    <th className="text-left p-2">Beoordeling</th>
                    <th className="text-left p-2">Type afwijking</th>
                    <th className="text-left p-2">Deadline</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.filter((f) => f.onderdeel === o).map((f) => (
                    <React.Fragment key={f.id}>
                      <tr className="border-b">
                        <td className="p-2">{f.controlepunt}</td>
                        <td className="p-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${f.deel === 1 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            Deel {f.deel}
                          </span>
                        </td>
                        <td className="p-2">
                          {canEditFinding(f) ? (
                            <select
                              className="border rounded px-1 py-0.5 text-sm"
                              value={f.beoordeling ?? ""}
                              onChange={(e) => updateBeoordeling(f.id, e.target.value as any)}
                            >
                              <option value="">—</option>
                              <option value="goed">Goed</option>
                              <option value="niet_goed">Niet goed</option>
                              <option value="interne_alert">Interne alert</option>
                            </select>
                          ) : (
                            f.beoordeling ?? "—"
                          )}
                        </td>
                        <td className="p-2">
                          {canEditFinding(f) && (f.beoordeling === "niet_goed" || f.beoordeling === "interne_alert") ? (
                            <select
                              className="border rounded px-1 py-0.5 text-sm"
                              value={f.type_afwijking ?? ""}
                              onChange={(e) => updateAfwijkingType(f.id, e.target.value as any)}
                            >
                              <option value="kritiek">Kritiek</option>
                              <option value="niet_kritiek">Niet kritiek</option>
                            </select>
                          ) : (
                            f.type_afwijking ?? "—"
                          )}
                        </td>
                        <td className="p-2">{f.deadline ? new Date(f.deadline).toLocaleDateString("nl-NL") : "—"}</td>
                        <td className="p-2">{f.status}</td>
                      </tr>
                      {((canEditFinding(f) && (f.beoordeling === "niet_goed" || f.beoordeling === "interne_alert")) || (f as any).toelichting) && (
                        <tr key={f.id + "-toel"} className="border-b bg-muted/30">
                          <td colSpan={6} className="px-2 pb-2">
                            <FindingToelichting
                              findingId={f.id}
                              initialValue={(f as any).toelichting}
                              editable={canEditFinding(f)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </TabsContent>
          ))}

          {/* EP2 Eindtabblad */}
          <TabsContent value="__ep2__">
            <div className="border rounded p-4 space-y-4 max-w-md">
              <h2 className="text-lg font-semibold">EP2 Beoordeling</h2>

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
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded text-sm">
                  <div>
                    <span className="text-muted-foreground">Afwijking absoluut:</span>
                    <p className="font-medium">{afwijkingAbs.toFixed(2)} kWh/m²</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Afwijking %:</span>
                    <p className="font-medium">{afwijkingPct !== null ? afwijkingPct.toFixed(1) + "%" : "—"}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Beoordeling</label>
                <select
                  className="w-full border rounded px-2 py-1.5 text-sm"
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
                <Button onClick={saveEp2} size="sm">
                  EP2 opslaan
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-muted-foreground">Geen findings.</p>
      )}

      <div className="mt-4 flex gap-2">
        {canDeel1 && (
          <Button onClick={deel1Afronden}>Deel 1 afronden</Button>
        )}
        {canDeel2 && (
          <Button onClick={auditAfronden}>Audit afronden</Button>
        )}
      </div>
    </div>
  );
}
