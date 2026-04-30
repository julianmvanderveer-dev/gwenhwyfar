import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Project = Tables<"projects">;

type ConceptReactie = {
  type: "akkoord" | "niet_akkoord";
  bericht?: string;
  bijlage_pad?: string | null;
  opgeslagen_op: string;
};

type ConceptBeoordeling = {
  type: "akkoord" | "niet_akkoord";
  toelichting?: string | null;
  upload_vereist?: boolean;
  opgeslagen_op: string;
};

interface Props {
  project: Project;
  findings: Finding[];
  onSent: () => void;
}

export default function BatchVersturen({ project, findings, onSent }: Props) {
  const { user, hasRole } = useAuth();
  const [busy, setBusy] = useState(false);

  const isEpAdviseur = hasRole("ep_adviseur");
  const isAuditor = hasRole("auditor") || hasRole("beheer");

  // === EP-adviseur batch ===
  // Open findings die zichtbaar zijn voor adviseur en wachten op zijn reactie
  const wachtOpAdviseur = findings.filter(
    (f) => f.zichtbaar_voor_adviseur && f.status === "open"
  );
  const adviseurConcepten = wachtOpAdviseur.filter(
    (f) => !!(f as any).concept_reactie
  );

  // === Auditor batch ===
  // Findings waarvan adviseur heeft gereageerd
  const wachtOpAuditor = findings.filter((f) => f.status === "reactie_ontvangen");
  const auditorConcepten = wachtOpAuditor.filter(
    (f) => !!(f as any).concept_beoordeling
  );

  const verstuurAdviseur = async () => {
    if (!user) return;
    if (adviseurConcepten.length !== wachtOpAdviseur.length) return;
    setBusy(true);
    try {
      // Maak messages aan en update finding-statussen
      const messages = wachtOpAdviseur.map((f) => {
        const c = (f as any).concept_reactie as ConceptReactie;
        return {
          finding_id: f.id,
          afzender_id: user.id,
          bericht: c.bericht || (c.type === "akkoord" ? "Afwijking geaccepteerd" : ""),
          bijlage_pad: c.bijlage_pad ?? null,
        };
      });
      const { error: msgErr } = await supabase.from("messages").insert(messages);
      if (msgErr) throw msgErr;

      const ids = wachtOpAdviseur.map((f) => f.id);
      const { error: updErr } = await supabase
        .from("findings")
        .update({ status: "reactie_ontvangen" as any, concept_reactie: null })
        .in("id", ids);
      if (updErr) throw updErr;

      // In-app notificatie naar toegewezen auditor (of alle interne medewerkers)
      if (project.toegewezen_aan) {
        await supabase.from("notificaties").insert({
          user_id: project.toegewezen_aan,
          bericht: `EP-adviseur heeft alle reacties verstuurd voor project ${project.projectnaam}`,
        });
      }

      toast({
        title: "Reacties verstuurd",
        description: `${ids.length} reactie(s) verzonden naar de auditor.`,
      });
      onSent();
    } catch (err: any) {
      toast({ title: "Versturen mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const verstuurAuditor = async () => {
    if (!user) return;
    if (auditorConcepten.length !== wachtOpAuditor.length) return;
    setBusy(true);
    try {
      const akkoordIds: string[] = [];
      const heropenenIds: string[] = [];
      const heropenenUploadVereist: string[] = [];
      const messages: any[] = [];

      for (const f of wachtOpAuditor) {
        const c = (f as any).concept_beoordeling as ConceptBeoordeling;
        if (c.type === "akkoord") {
          akkoordIds.push(f.id);
          if (c.toelichting) {
            messages.push({
              finding_id: f.id,
              afzender_id: user.id,
              bericht: `[Goedgekeurd] ${c.toelichting}`,
            });
          }
        } else {
          heropenenIds.push(f.id);
          if (c.upload_vereist) heropenenUploadVereist.push(f.id);
          messages.push({
            finding_id: f.id,
            afzender_id: user.id,
            bericht: `[Niet akkoord — bevinding heropend] ${c.toelichting ?? ""}`.trim(),
          });
        }
      }

      if (messages.length > 0) {
        const { error: msgErr } = await supabase.from("messages").insert(messages);
        if (msgErr) throw msgErr;
      }

      if (akkoordIds.length > 0) {
        const { error } = await supabase
          .from("findings")
          .update({
            status: "reactie_goedgekeurd" as any,
            goedgekeurd_op: new Date().toISOString(),
            concept_beoordeling: null,
          })
          .in("id", akkoordIds);
        if (error) throw error;
      }

      if (heropenenIds.length > 0) {
        // Eerst zonder upload_vereist
        const idsZonderUpload = heropenenIds.filter((id) => !heropenenUploadVereist.includes(id));
        if (idsZonderUpload.length > 0) {
          const { error } = await supabase
            .from("findings")
            .update({ status: "open" as any, concept_beoordeling: null, upload_vereist: false })
            .in("id", idsZonderUpload);
          if (error) throw error;
        }
        if (heropenenUploadVereist.length > 0) {
          const { error } = await supabase
            .from("findings")
            .update({ status: "open" as any, concept_beoordeling: null, upload_vereist: true })
            .in("id", heropenenUploadVereist);
          if (error) throw error;
        }

        // Project resetten op nieuwe reactiedeadline (2 weken)
        const nieuweDeadline = new Date();
        nieuweDeadline.setDate(nieuweDeadline.getDate() + 14);
        await supabase
          .from("projects")
          .update({
            status: "wacht_op_reactie" as any,
            reactie_deadline: nieuweDeadline.toISOString(),
            reminder_pre_sent: false,
            reminder_overdue_1w_sent: false,
            reminder_overdue_2w_sent: false,
            reminder_overdue_3w_sent: false,
          })
          .eq("id", project.id);

        // Mail adviseur
        supabase.functions
          .invoke("notify-adviseur", {
            body: { type: "niet_akkoord", project_id: project.id },
          })
          .then(({ error }) => {
            if (error) console.error("Notificatie fout:", error);
          });
      }

      toast({
        title: "Beoordelingen verstuurd",
        description: `${akkoordIds.length} goedgekeurd, ${heropenenIds.length} heropend.`,
      });
      onSent();
    } catch (err: any) {
      toast({ title: "Versturen mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // EP-adviseur paneel
  if (isEpAdviseur && wachtOpAdviseur.length > 0) {
    const klaar = adviseurConcepten.length === wachtOpAdviseur.length;
    return (
      <div className="border rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Reacties versturen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {adviseurConcepten.length} van {wachtOpAdviseur.length} bevinding(en) beantwoord.
              {klaar
                ? " Je kunt alles in één keer versturen naar de auditor."
                : " Je kunt versturen zodra je alle openstaande bevindingen hebt beantwoord."}
            </p>
          </div>
          <Button onClick={verstuurAdviseur} disabled={!klaar || busy} className="gap-2 shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Alle reacties versturen
          </Button>
        </div>
      </div>
    );
  }

  // Auditor paneel
  if (isAuditor && wachtOpAuditor.length > 0) {
    const klaar = auditorConcepten.length === wachtOpAuditor.length;
    const akkoordCount = auditorConcepten.filter(
      (f) => ((f as any).concept_beoordeling as ConceptBeoordeling)?.type === "akkoord"
    ).length;
    const nietAkkoordCount = auditorConcepten.length - akkoordCount;
    return (
      <div className="border rounded-lg bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Beoordelingen versturen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {auditorConcepten.length} van {wachtOpAuditor.length} reactie(s) beoordeeld
              {auditorConcepten.length > 0 &&
                ` — ${akkoordCount} goedgekeurd, ${nietAkkoordCount} niet akkoord`}
              .
              {klaar
                ? " Je kunt alles in één keer versturen naar de EP-adviseur."
                : " Je kunt versturen zodra je alle reacties hebt beoordeeld."}
            </p>
          </div>
          <Button onClick={verstuurAuditor} disabled={!klaar || busy} className="gap-2 shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Alle beoordelingen versturen
          </Button>
        </div>
      </div>
    );
  }

  return null;
}