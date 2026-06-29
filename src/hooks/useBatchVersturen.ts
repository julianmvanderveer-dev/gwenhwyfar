import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Project = Tables<"projects">;

export type ConceptReactie = {
  type: "akkoord" | "niet_akkoord";
  bericht?: string;
  bijlage_pad?: string | null;
  opgeslagen_op: string;
};

export type ConceptBeoordeling = {
  type: "akkoord" | "niet_akkoord";
  toelichting?: string | null;
  upload_vereist?: boolean;
  opgeslagen_op: string;
};

export function useBatchVersturen(
  project: Project | null,
  findings: Finding[],
  onSent?: () => void,
) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const wachtOpAdviseur = findings.filter(
    (f) => f.zichtbaar_voor_adviseur && f.status === "open",
  );
  const adviseurConcepten = wachtOpAdviseur.filter(
    (f) => !!(f as any).concept_reactie,
  );

  const wachtOpAuditor = findings.filter((f) => f.status === "reactie_ontvangen");
  const auditorConcepten = wachtOpAuditor.filter(
    (f) => !!(f as any).concept_beoordeling,
  );

  const adviseurKlaar =
    wachtOpAdviseur.length > 0 &&
    adviseurConcepten.length === wachtOpAdviseur.length;
  const auditorKlaar =
    wachtOpAuditor.length > 0 &&
    auditorConcepten.length === wachtOpAuditor.length;

  const akkoordCount = auditorConcepten.filter(
    (f) => ((f as any).concept_beoordeling as ConceptBeoordeling)?.type === "akkoord",
  ).length;
  const nietAkkoordCount = auditorConcepten.length - akkoordCount;

  const verstuurAdviseur = async () => {
    if (!user || !project) return;
    if (!adviseurKlaar) return;
    setBusy(true);
    try {
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

      // Functiescheiding: als de huidige user (EP-adviseur) ook de toegewezen auditor is,
      // dan kan hij zijn eigen reactie niet beoordelen. Zet het project terug in de pool
      // zodat een andere auditor het kan oppakken.
      if (project.toegewezen_aan && project.toegewezen_aan === user.id) {
        await supabase
          .from("projects")
          .update({ toegewezen_aan: null, toegewezen_op: null, toewijzing: "pool" as any })
          .eq("id", project.id);
      }

      if (project.toegewezen_aan) {
        await supabase.from("notificaties").insert({
          user_id: project.toegewezen_aan,
          bericht: `EP-adviseur heeft alle reacties verstuurd voor project ${project.projectnaam}`,
        });
      }

      supabase.functions
        .invoke("notify-auditor", {
          body: { type: "reactie_ontvangen", project_id: project.id },
        })
        .then(({ error }) => {
          if (error) console.error("Notificatie auditor fout:", error);
        });

      toast({
        title: "Reacties verstuurd",
        description: `${ids.length} reactie(s) verzonden naar de auditor.`,
      });
      onSent?.();
    } catch (err: any) {
      toast({ title: "Versturen mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const verstuurAuditor = async () => {
    if (!user || !project) return;
    if (!auditorKlaar) return;
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
        const idsZonderUpload = heropenenIds.filter(
          (id) => !heropenenUploadVereist.includes(id),
        );
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

      // Als er geen heropende bevindingen zijn, controleer of het hele project nu klaar is.
      // Alle bevindingen moeten dan in een afgesloten status staan
      // (reactie_goedgekeurd of gesloten) — dan ronden we de audit af.
      if (heropenenIds.length === 0) {
        // Alleen bevindingen die daadwerkelijk naar de adviseur zijn gegaan
        // tellen mee voor "audit afgerond". Checklist-items met beoordeling "goed"
        // of nog niet beoordeeld zijn niet zichtbaar voor de adviseur en hoeven
        // niet de reactie-cyclus door.
        const { data: nogOpen } = await supabase
          .from("findings")
          .select("id")
          .eq("project_id", project.id)
          .eq("zichtbaar_voor_adviseur", true)
          .not("status", "in", "(reactie_goedgekeurd,gesloten)");

        if (!nogOpen || nogOpen.length === 0) {
          // Vereiste: EP-adviseur met e-mailadres voordat we de audit afronden
          const { data: projMeta } = await supabase
            .from("projects")
            .select("adviseur_id, adviseurs:adviseur_id(email)")
            .eq("id", project.id)
            .maybeSingle();
          const adviseurEmail = (projMeta as any)?.adviseurs?.email as string | null | undefined;
          if (!projMeta?.adviseur_id || !adviseurEmail) {
            toast({
              title: "Audit kan niet worden afgerond",
              description: "De EP-adviseur heeft geen e-mailadres. Vul dit eerst in bij Beheer → Adviseurs.",
              variant: "destructive",
            });
            return;
          }

          await supabase
            .from("projects")
            .update({
              status: "afgerond" as any,
              gearchiveerd_op: new Date().toISOString(),
            })
            .eq("id", project.id);

          // Notificeer EP-adviseur dat de audit is afgerond
          supabase.functions
            .invoke("notify-adviseur", {
              body: { type: "audit_volledig_afgerond", project_id: project.id },
            })
            .then(({ error }) => {
              if (error) console.error("Notificatie audit afgerond fout:", error);
            });

          // Notificeer ook de auditor
          supabase.functions
            .invoke("notify-auditor", {
              body: { type: "audit_afgerond", project_id: project.id },
            })
            .then(({ error }) => {
              if (error) console.error("Notificatie auditor audit afgerond fout:", error);
            });

          toast({
            title: "Audit afgerond",
            description: "Alle bevindingen zijn goedgekeurd. De EP-adviseur is geïnformeerd.",
          });
        }
      }

      onSent?.();
    } catch (err: any) {
      toast({ title: "Versturen mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    wachtOpAdviseur,
    adviseurConcepten,
    adviseurKlaar,
    verstuurAdviseur,
    wachtOpAuditor,
    auditorConcepten,
    auditorKlaar,
    verstuurAuditor,
    akkoordCount,
    nietAkkoordCount,
  };
}