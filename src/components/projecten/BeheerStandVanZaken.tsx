import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { UserCog, UserCheck, Clock, Activity, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;

type ActiviteitRegel = {
  datum: string;
  naam: string;
  rol: string;
  bericht: string;
  finding_id: string;
  controlepunt: string;
};

const rolLabel: Record<string, string> = {
  beheer: "Beheer",
  auditor: "Auditor",
  tekenaar: "Tekenaar",
  ep_adviseur: "EP-adviseur",
};

const rolPrioriteit = ["beheer", "auditor", "tekenaar", "ep_adviseur"];

function formatDatum(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function formatDatumKort(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function deadlineTier(deadlineIso: string | null): { label: string; className: string; dagen: number } | null {
  if (!deadlineIso) return null;
  const nu = new Date();
  const dl = new Date(deadlineIso);
  const dagen = Math.round((dl.getTime() - nu.getTime()) / (1000 * 60 * 60 * 24));
  if (dagen > 1) return { label: `over ${dagen} dagen`, className: "text-emerald-700 bg-emerald-50", dagen };
  if (dagen === 1) return { label: "morgen", className: "text-amber-700 bg-amber-50", dagen };
  if (dagen === 0) return { label: "vandaag", className: "text-amber-700 bg-amber-50", dagen };
  if (dagen >= -7) return { label: `${Math.abs(dagen)} dagen over tijd`, className: "text-orange-700 bg-orange-50", dagen };
  if (dagen >= -14) return { label: `${Math.abs(dagen)} dagen over tijd`, className: "text-red-700 bg-red-50", dagen };
  return { label: `${Math.abs(dagen)} dagen over tijd`, className: "text-red-800 bg-red-100 font-bold", dagen };
}

export default function BeheerStandVanZaken({ project, findings }: { project: Project; findings: Finding[] }) {
  const { hasRole } = useAuth();
  const [activiteit, setActiviteit] = useState<ActiviteitRegel[]>([]);
  const [toegewezenNaam, setToegewezenNaam] = useState<string | null>(null);
  const [toegewezenRol, setToegewezenRol] = useState<string | null>(null);
  const [adviseurNaam, setAdviseurNaam] = useState<string | null>(null);
  const [adviseurLijst, setAdviseurLijst] = useState<{ id: string; nummer: number; naam: string }[]>([]);
  const [adviseurBewerken, setAdviseurBewerken] = useState(false);
  const [nieuweAdviseurId, setNieuweAdviseurId] = useState<string>("");
  const [adviseurOpslaan, setAdviseurOpslaan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const findingIds = findings.map((f) => f.id);
      if (findingIds.length === 0) {
        setActiviteit([]);
        return;
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("finding_id, afzender_id, bericht, datum")
        .in("finding_id", findingIds)
        .order("datum", { ascending: false })
        .limit(8);

      const afzenderIds = [...new Set((msgs ?? []).map((m) => m.afzender_id))];
      const [{ data: profielen }, { data: rollen }] = await Promise.all([
        afzenderIds.length
          ? supabase.from("profiles").select("id, naam").in("id", afzenderIds)
          : Promise.resolve({ data: [] as { id: string; naam: string }[] }),
        afzenderIds.length
          ? supabase.from("user_roles").select("user_id, role").in("user_id", afzenderIds)
          : Promise.resolve({ data: [] as { user_id: string; role: string }[] }),
      ]);

      const naamMap = new Map((profielen ?? []).map((p) => [p.id, p.naam]));
      const rollenMap = new Map<string, string[]>();
      (rollen ?? []).forEach((r) => {
        const arr = rollenMap.get(r.user_id) ?? [];
        arr.push(r.role);
        rollenMap.set(r.user_id, arr);
      });
      const findingMap = new Map(findings.map((f) => [f.id, f.controlepunt]));

      const regels: ActiviteitRegel[] = (msgs ?? []).slice(0, 5).map((m) => {
        const userRollen = rollenMap.get(m.afzender_id) ?? [];
        const hoofdrol = rolPrioriteit.find((r) => userRollen.includes(r)) ?? "—";
        return {
          datum: m.datum,
          naam: naamMap.get(m.afzender_id) ?? "Onbekend",
          rol: rolLabel[hoofdrol] ?? hoofdrol,
          bericht: m.bericht,
          finding_id: m.finding_id,
          controlepunt: findingMap.get(m.finding_id) ?? "",
        };
      });

      if (!cancelled) setActiviteit(regels);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [project.id, findings]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (project.toegewezen_aan) {
        const [{ data: prof }, { data: rollen }] = await Promise.all([
          supabase.from("profiles").select("naam").eq("id", project.toegewezen_aan).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", project.toegewezen_aan),
        ]);
        if (!cancelled) {
          setToegewezenNaam(prof?.naam ?? null);
          const userRollen = (rollen ?? []).map((r) => r.role as string);
          const hoofd = rolPrioriteit.find((r) => userRollen.includes(r));
          setToegewezenRol(hoofd ? rolLabel[hoofd] : null);
        }
      } else {
        setToegewezenNaam(null);
        setToegewezenRol(null);
      }
      if (project.adviseur_id) {
        const { data } = await supabase.from("adviseurs").select("naam").eq("id", project.adviseur_id).maybeSingle();
        if (!cancelled) setAdviseurNaam(data?.naam ?? null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [project.toegewezen_aan, project.adviseur_id]);

  const reactiesTeBeoordelen = findings.filter((f) => f.status === "reactie_ontvangen").length;
  const conceptBeoordelingen = findings.filter(
    (f) => f.status === "reactie_ontvangen" && (f as any).concept_beoordeling,
  ).length;
  const openVoorAdviseur = findings.filter(
    (f) => f.status === "open" && f.zichtbaar_voor_adviseur,
  ).length;
  const conceptReacties = findings.filter(
    (f) => f.status === "open" && f.zichtbaar_voor_adviseur && (f as any).concept_reactie,
  ).length;
  const wachtOpAdviseur = project.status === "wacht_op_reactie";
  const tier = wachtOpAdviseur ? deadlineTier(project.reactie_deadline) : null;

  const loskoppelToewijzing = async () => {
    if (!project.toegewezen_aan) return;
    const naam = toegewezenNaam ?? "deze persoon";
    if (!confirm(`Toewijzing van "${naam}" loskoppelen? Het project komt terug in de pool.`)) return;
    const oudeId = project.toegewezen_aan;
    const { error } = await supabase
      .from("projects")
      .update({ toegewezen_aan: null, toegewezen_op: null })
      .eq("id", project.id);
    if (error) {
      toast({ title: "Loskoppelen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("notificaties").insert({
      user_id: oudeId,
      bericht: `Project "${project.projectnaam}" is bij je weggehaald en teruggeplaatst in de pool.`,
    });
    setToegewezenNaam(null);
    setToegewezenRol(null);
    toast({ title: "Toewijzing losgekoppeld" });
  };

  const loskoppelAdviseur = async () => {
    if (!project.adviseur_id) return;
    const naam = adviseurNaam ?? "deze EP-adviseur";
    if (!confirm(`EP-adviseur "${naam}" loskoppelen van dit project?`)) return;
    const { error } = await supabase
      .from("projects")
      .update({ adviseur_id: null })
      .eq("id", project.id);
    if (error) {
      toast({ title: "Loskoppelen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    setAdviseurNaam(null);
    toast({ title: "EP-adviseur losgekoppeld" });
  };

  // Bepaal "bal ligt bij"
  let balLigtBij: string;
  if (reactiesTeBeoordelen > 0) {
    balLigtBij = "Intern (auditor/tekenaar)";
  } else if (wachtOpAdviseur && openVoorAdviseur > 0) {
    balLigtBij = "EP-adviseur";
  } else if (project.status === "afgerond" || project.status === "gesloten") {
    balLigtBij = "Afgerond";
  } else {
    balLigtBij = "Intern";
  }

  return (
    <div className="border rounded-lg bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Stand van zaken</h3>
        <span className="text-xs text-muted-foreground">· beheeroverzicht</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kolom 1: Bij wie ligt het */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bal ligt bij</div>
          <div className="text-sm font-semibold">{balLigtBij}</div>

          <div className="pt-1 space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <UserCog className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted-foreground">Toegewezen</div>
                <div className="font-medium flex items-center gap-1">
                  <span className="truncate">
                    {toegewezenNaam ? `${toegewezenNaam}${toegewezenRol ? ` (${toegewezenRol})` : ""}` : <span className="text-muted-foreground italic">Pool — nog niet geclaimd</span>}
                  </span>
                  {hasRole("beheer") && project.toegewezen_aan && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      aria-label="Toewijzing loskoppelen"
                      title="Toewijzing loskoppelen"
                      onClick={loskoppelToewijzing}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-muted-foreground">EP-adviseur</div>
                <div className="font-medium flex items-center gap-1">
                  <span className="truncate">{adviseurNaam ?? "—"}</span>
                  {hasRole("beheer") && project.adviseur_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      aria-label="EP-adviseur loskoppelen"
                      title="EP-adviseur loskoppelen"
                      onClick={loskoppelAdviseur}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Tellers */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Open taken</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span>Reacties te beoordelen</span>
              <span className={`font-semibold ${reactiesTeBeoordelen > 0 ? "text-orange-700" : "text-muted-foreground"}`}>
                {conceptBeoordelingen > 0 && reactiesTeBeoordelen > 0
                  ? `${conceptBeoordelingen}/${reactiesTeBeoordelen} concept`
                  : reactiesTeBeoordelen}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-1.5">
              <span>Bevindingen open bij EP-adviseur</span>
              <span className={`font-semibold ${openVoorAdviseur > 0 ? "text-blue-700" : "text-muted-foreground"}`}>
                {conceptReacties > 0 && openVoorAdviseur > 0
                  ? `${conceptReacties}/${openVoorAdviseur} concept`
                  : openVoorAdviseur}
              </span>
            </div>
            {wachtOpAdviseur && project.reactie_deadline && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Reactiedeadline
                </span>
                <span className="text-right">
                  <span className="font-medium">{formatDatumKort(project.reactie_deadline)}</span>
                  {tier && (
                    <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tier.className}`}>
                      {tier.label}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom 3: Laatste activiteit */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Laatste activiteit</div>
          {activiteit.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">Nog geen berichten op dit project.</div>
          ) : (
            <ol className="space-y-1.5 text-xs">
              {activiteit.map((a, i) => (
                <li key={i} className="border-b last:border-0 pb-1.5 last:pb-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{formatDatum(a.datum)}</span>
                    <span className="font-medium truncate">{a.naam}</span>
                    <span className="text-[10px] text-muted-foreground">({a.rol})</span>
                  </div>
                  <div className="text-muted-foreground truncate" title={`${a.controlepunt} — ${a.bericht}`}>
                    {a.controlepunt && <span className="font-mono text-[10px] mr-1">{a.controlepunt.split(".")[0]}</span>}
                    {a.bericht}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}