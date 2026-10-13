import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { FolderX, CheckCircle2, FolderOpen, Loader2 } from "lucide-react";

export type DossierVerzoek = {
  id: string;
  project_id: string;
  aangevraagd_door: string | null;
  aangevraagd_door_naam: string | null;
  rol: string | null;
  opmerking: string | null;
  created_at: string;
  gemeld_compleet_op: string | null;
  afgehandeld_op: string | null;
  afgehandeld_door_naam: string | null;
};

type Tpl = { code: string; onderdeel: string; controlepunt: string; deel: number };
type F = { id: string; onderdeel: string; controlepunt: string; deel: number };

interface Props {
  project: { id: string; projectnaam: string; status: string; dropbox_link?: string | null; toegewezen_aan?: string | null };
  templates: Tpl[];
  findings: F[];
  canRequest: boolean;
  isAdviseur: boolean;
  onOpenChange: (open: boolean) => void;
  onFindingsChanged: () => void;
}

const fmt = (d: string) => new Date(d).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" });

export default function DossierIncompleet({ project, templates, findings, canRequest, isAdviseur, onOpenChange, onFindingsChanged }: Props) {
  const { user, actsAs: hasRole } = useAuth();
  const [verzoeken, setVerzoeken] = useState<DossierVerzoek[]>([]);
  const [dialog, setDialog] = useState(false);
  const [opmerking, setOpmerking] = useState("");
  const [bezig, setBezig] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("dossier_verzoeken")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as DossierVerzoek[];
    setVerzoeken(list);
    onOpenChange(list.some((v) => !v.afgehandeld_op));
  }, [project.id, onOpenChange]);

  useEffect(() => { void load(); }, [load]);

  const open = verzoeken.find((v) => !v.afgehandeld_op);
  const isDeel2 = ["deel1_afgerond", "deel2_bezig"].includes(project.status);
  const rol = isDeel2 && hasRole("auditor") ? "auditor" : hasRole("tekenaar") ? "tekenaar" : hasRole("auditor") ? "auditor" : "beheer";

  const naamVanMij = async () => {
    const { data } = await supabase.from("profiles").select("naam").eq("id", user!.id).maybeSingle();
    return data?.naam ?? null;
  };

  const verstuur = async () => {
    if (!user) return;
    setBezig(true);
    try {
      const naam = await naamVanMij();
      const datum = new Date().toLocaleDateString("nl-NL");
      const toelichting = `Dossier onvoldoende compleet voor audit (gemeld door ${naam ?? rol} op ${datum}). EP-adviseur is verzocht het dossier via Dropbox te completeren.${opmerking.trim() ? `\n${opmerking.trim()}` : ""}`;

      // 1a en 1b op Niet goed / NKT
      for (const code of ["1a", "1b"]) {
        const t = templates.find((x) => x.code === code && x.deel === 1);
        if (!t) continue;
        const bestaand = findings.find((f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel);
        const velden: any = {
          beoordeling: "niet_goed",
          type_afwijking: "niet_kritiek",
          status: "open",
          eigenaar_beoordeling: rol === "beheer" ? "auditor" : rol,
          toegewezen_beoordelaar: user.id,
          toelichting,
        };
        const { error } = bestaand
          ? await supabase.from("findings").update(velden).eq("id", bestaand.id)
          : await supabase.from("findings").insert({ project_id: project.id, onderdeel: t.onderdeel, controlepunt: t.controlepunt, deel: t.deel, ...velden });
        if (error) throw error;
      }

      const { error: vErr } = await supabase.from("dossier_verzoeken").insert({
        project_id: project.id,
        aangevraagd_door: user.id,
        aangevraagd_door_naam: naam,
        rol,
        opmerking: opmerking.trim() || null,
      });
      if (vErr) throw vErr;

      supabase.functions
        .invoke("notify-adviseur", {
          body: { type: "dossier_incompleet", project_id: project.id, extra: { opmerking: opmerking.trim() || null } },
        })
        .then(({ error }) => error && console.error("Mail dossierverzoek fout:", error));

      setDialog(false);
      setOpmerking("");
      toast({ title: "Verzoek verstuurd", description: "1a en 1b staan op NKT en het eindresultaat op KT. Je kunt gewoon verder met de audit." });
      onFindingsChanged();
      await load();
    } catch (e: any) {
      toast({ title: "Niet gelukt", description: e.message, variant: "destructive" });
    } finally {
      setBezig(false);
    }
  };

  const meldCompleet = async () => {
    if (!open || !user) return;
    setBezig(true);
    const { error } = await supabase
      .from("dossier_verzoeken")
      .update({ gemeld_compleet_op: new Date().toISOString(), gemeld_compleet_door: user.id })
      .eq("id", open.id);
    if (error) {
      toast({ title: "Niet gelukt", description: error.message, variant: "destructive" });
    } else {
      const ontvangers = Array.from(new Set([open.aangevraagd_door, project.toegewezen_aan].filter(Boolean))) as string[];
      for (const uid of ontvangers) {
        await supabase.from("notificaties").insert({ user_id: uid, bericht: `EP-adviseur meldt: dossier van ${project.projectnaam} is aangevuld op Dropbox` });
      }
      supabase.functions
        .invoke("notify-auditor", { body: { type: "dossier_compleet", project_id: project.id } })
        .then(({ error: mErr }) => mErr && console.error("Mail dossier compleet fout:", mErr));
      toast({ title: "Bedankt", description: "De auditor is op de hoogte gebracht." });
    }
    setBezig(false);
    await load();
  };

  const afhandelen = async () => {
    if (!open || !user) return;
    setBezig(true);
    const naam = await naamVanMij();
    const { error } = await supabase
      .from("dossier_verzoeken")
      .update({ afgehandeld_op: new Date().toISOString(), afgehandeld_door: user.id, afgehandeld_door_naam: naam })
      .eq("id", open.id);
    if (error) toast({ title: "Niet gelukt", description: error.message, variant: "destructive" });
    else toast({ title: "Dossier weer compleet", description: "De KT door het onvolledige dossier vervalt. Beoordeel 1a en 1b opnieuw." });
    setBezig(false);
    await load();
  };

  const eerdere = verzoeken.filter((v) => v.afgehandeld_op);

  if (!open && !canRequest && eerdere.length === 0) return null;

  return (
    <div className="space-y-2">
      {open ? (
        <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <FolderX className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-destructive">Dossier niet compleet — eindresultaat KT</h3>
                <p className="text-xs text-muted-foreground">
                  Gemeld door {open.aangevraagd_door_naam ?? open.rol ?? "onbekend"} op {fmt(open.created_at)}.
                  {open.opmerking ? <> Opmerking: <em>{open.opmerking}</em></> : null}
                </p>
                <p className="text-xs">
                  {open.gemeld_compleet_op
                    ? <span className="text-accent font-medium">EP-adviseur meldde het dossier compleet op {fmt(open.gemeld_compleet_op)}.</span>
                    : <span className="text-muted-foreground">EP-adviseur heeft nog niet gemeld dat het dossier is aangevuld.</span>}
                </p>
                {isAdviseur && (
                  <p className="text-xs text-muted-foreground">
                    Vul het dossier aan via Dropbox, met alle stukken overzichtelijk geordend, en meld het hier als het klaar is.
                  </p>
                )}
                {project.dropbox_link && (
                  <a href={project.dropbox_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5" /> Dossier op Dropbox
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {isAdviseur && !open.gemeld_compleet_op && (
                <Button size="sm" onClick={meldCompleet} disabled={bezig} className="gap-1.5">
                  {bezig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Dossier aangevuld op Dropbox
                </Button>
              )}
              {canRequest && (
                <Button size="sm" variant="outline" onClick={afhandelen} disabled={bezig} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Dossier is weer compleet
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : canRequest ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/40" onClick={() => setDialog(true)}>
            <FolderX className="h-3.5 w-3.5" /> Dossier onvoldoende voor audit
          </Button>
        </div>
      ) : null}

      {eerdere.length > 0 && !isAdviseur && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Eerdere dossierverzoeken ({eerdere.length})</summary>
          <ul className="mt-1 space-y-0.5 pl-4 list-disc">
            {eerdere.map((v) => (
              <li key={v.id}>
                {fmt(v.created_at)} door {v.aangevraagd_door_naam ?? v.rol ?? "onbekend"}
                {v.gemeld_compleet_op ? `; adviseur meldde compleet ${fmt(v.gemeld_compleet_op)}` : "; adviseur meldde niet"}
                {v.afgehandeld_op ? `; afgehandeld ${fmt(v.afgehandeld_op)}${v.afgehandeld_door_naam ? ` door ${v.afgehandeld_door_naam}` : ""}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dossier onvoldoende voor audit</DialogTitle>
            <DialogDescription>
              De EP-adviseur krijgt een mail met het verzoek de ontbrekende bestanden zelf in Dropbox te uploaden. Controlepunten 1a en 1b
              worden op Niet goed (NKT) gezet en het eindresultaat wordt KT totdat het dossier weer compleet is.
              Je kunt daarna gewoon verder met de audit.
            </DialogDescription>
          </DialogHeader>
          {!project.dropbox_link && (
            <p className="text-xs text-destructive">Let op: er is nog geen Dropbox-link bij dit project ingevuld.</p>
          )}
          <Textarea
            placeholder="Optioneel: wat ontbreekt er? (bijv. tekeningen, foto's installaties)"
            value={opmerking}
            onChange={(e) => setOpmerking(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Annuleren</Button>
            <Button onClick={verstuur} disabled={bezig} className="gap-1.5">
              {bezig && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Verzoek sturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
