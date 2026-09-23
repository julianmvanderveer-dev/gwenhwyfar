import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowRightLeft, RotateCcw, Check, X, Search } from "lucide-react";
import { statusBadge } from "@/lib/badges";
import type { Tables } from "@/integrations/supabase/types";

type ToewijzingProject = Tables<"projects"> & {
  adviseurs: { naam: string } | null;
  toegewezen_profiel: { naam: string } | null;
};

export default function ToewijzingenBeheer() {
  const [toewijzingProjecten, setToewijzingProjecten] = useState<ToewijzingProject[]>([]);
  const [toewijsbarePersonen, setToewijsbarePersonen] = useState<
    { id: string; naam: string; roles: string[]; auditCategorieen: string[] }[]
  >([]);
  const [hertoewijzingProjectId, setHertoewijzingProjectId] = useState<string | null>(null);
  const [hertoewijzingAan, setHertoewijzingAan] = useState("");
  const [zoekterm, setZoekterm] = useState("");
  const [toonAfgerond, setToonAfgerond] = useState(false);

  useEffect(() => {
    loadToewijzingen();
  }, []);


  const loadToewijzingen = async () => {
    const { data: projectData } = await supabase
      .from("projects")
      .select("*, adviseurs(naam)")
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });

    const projects = (projectData ?? []) as ToewijzingProject[];

    const userIds = [...new Set(projects.filter((p) => p.toegewezen_aan).map((p) => p.toegewezen_aan!))];
    let profielMap = new Map<string, { naam: string }>();
    if (userIds.length > 0) {
      const { data: profielData } = await supabase.from("profiles").select("id, naam").in("id", userIds);
      profielMap = new Map((profielData ?? []).map((p) => [p.id, { naam: p.naam }]));
    }

    setToewijzingProjecten(
      projects.map((p) => ({
        ...p,
        toegewezen_profiel: p.toegewezen_aan ? profielMap.get(p.toegewezen_aan) ?? null : null,
      }))
    );

    const { data: allProfiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    const { data: allCats } = await supabase.from("user_audit_categorieen").select("user_id, audit_categorie");
    const personen = (allProfiles ?? [])
      .map((p) => ({
        ...p,
        roles: (allRoles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
        auditCategorieen: (allCats ?? []).filter((c) => c.user_id === p.id).map((c) => c.audit_categorie as string),
      }))
      .filter((p) => p.roles.includes("tekenaar") || p.roles.includes("auditor"));
    setToewijsbarePersonen(personen);
  };

  const hertoewijzen = async (projectId: string, nieuweUserId: string) => {
    const project = toewijzingProjecten.find((p) => p.id === projectId);
    if (!project) return;
    const oudeUserId = project.toegewezen_aan;

    await supabase
      .from("projects")
      .update({
        toegewezen_aan: nieuweUserId,
        toegewezen_op: new Date().toISOString(),
        toewijzing: "specifiek" as any,
      })
      .eq("id", projectId);

    await supabase
      .from("findings")
      .update({ toegewezen_beoordelaar: nieuweUserId })
      .eq("project_id", projectId)
      .in("status", ["open", "reactie_ontvangen"] as any);

    const notificaties = [];
    if (oudeUserId && oudeUserId !== nieuweUserId) {
      notificaties.push({
        user_id: oudeUserId,
        bericht: `Project "${project.projectnaam}" is aan je ontnomen en hertoegewezen.`,
      });
    }
    notificaties.push({ user_id: nieuweUserId, bericht: `Project "${project.projectnaam}" is aan je toegewezen.` });
    await supabase.from("notificaties").insert(notificaties);

    toast({ title: "Project hertoegewezen" });
    setHertoewijzingProjectId(null);
    setHertoewijzingAan("");
    loadToewijzingen();
  };

  const terugNaarPool = async (projectId: string) => {
    const project = toewijzingProjecten.find((p) => p.id === projectId);
    if (!project) return;
    const oudeUserId = project.toegewezen_aan;

    await supabase
      .from("projects")
      .update({ toegewezen_aan: null, toegewezen_op: null, toewijzing: "pool" as any })
      .eq("id", projectId);

    if (oudeUserId) {
      await supabase.from("notificaties").insert({
        user_id: oudeUserId,
        bericht: `Project "${project.projectnaam}" is aan je ontnomen en teruggeplaatst in de pool.`,
      });
    }

    toast({ title: "Project teruggeplaatst in pool" });
    loadToewijzingen();
  };

  return (
    <div className="border rounded-lg overflow-x-auto shadow-sm bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/60">
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Toegewezen aan</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Toegewezen op</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-56">Acties</th>
          </tr>
        </thead>
        <tbody>
          {toewijzingProjecten.map((p, i) => (
            <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
              <td className="px-4 py-2.5 font-medium">{p.projectnaam}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{p.status}</td>
              <td className="px-4 py-2.5">
                {p.toewijzing === "specifiek" ? (
                  <Badge variant="secondary" className="text-[10px]">Specifiek</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Pool</Badge>
                )}
              </td>
              <td className="px-4 py-2.5">
                {p.toegewezen_aan ? (
                  <span>{p.toegewezen_profiel?.naam ?? "Onbekend"}</span>
                ) : (
                  <span className="text-muted-foreground italic">Wacht in pool</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                {p.toegewezen_op ? new Date(p.toegewezen_op).toLocaleString("nl-NL") : "—"}
              </td>
              <td className="px-4 py-2.5">
                {hertoewijzingProjectId === p.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded px-2 py-1 text-xs flex-1"
                      value={hertoewijzingAan}
                      onChange={(e) => setHertoewijzingAan(e.target.value)}
                    >
                      {(() => {
                        const isTekenaarFase = ["nog_niet_begonnen", "deel1_bezig"].includes(p.status);
                        const isAuditorFase = ["deel1_afgerond", "deel2_bezig"].includes(p.status);
                        const gefilterd = toewijsbarePersonen.filter((pp) => {
                          if (isTekenaarFase && !pp.roles.includes("tekenaar")) return false;
                          if (isAuditorFase && !pp.roles.includes("auditor")) return false;
                          if (pp.auditCategorieen && pp.auditCategorieen.length > 0) {
                            if (!pp.auditCategorieen.includes(p.audit_categorie)) return false;
                          } else if (pp.auditCategorieen && pp.auditCategorieen.length === 0) {
                            return false;
                          }
                          return true;
                        });
                        return (
                          <>
                            <option value="">— Selecteer {isTekenaarFase ? "tekenaar" : isAuditorFase ? "auditor" : "persoon"} —</option>
                            {gefilterd.map((pp) => (
                              <option key={pp.id} value={pp.id}>
                                {pp.naam} ({pp.roles.filter((r) => r !== "beheer").join(", ")})
                              </option>
                            ))}
                          </>
                        );
                      })()}
                    </select>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!hertoewijzingAan} onClick={() => hertoewijzen(p.id, hertoewijzingAan)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setHertoewijzingProjectId(null); setHertoewijzingAan(""); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setHertoewijzingProjectId(p.id)}>
                      <ArrowRightLeft className="h-3 w-3" /> Hertoewijzen
                    </Button>
                    {p.toegewezen_aan && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => terugNaarPool(p.id)}>
                        <RotateCcw className="h-3 w-3" /> Pool
                      </Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          {toewijzingProjecten.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Geen actieve projecten.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
