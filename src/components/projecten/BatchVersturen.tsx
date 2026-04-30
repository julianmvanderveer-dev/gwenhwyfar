import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useBatchVersturen } from "@/hooks/useBatchVersturen";

type Finding = Tables<"findings">;
type Project = Tables<"projects">;

interface Props {
  project: Project;
  findings: Finding[];
  onSent: () => void;
}

export default function BatchVersturen({ project, findings, onSent }: Props) {
  const { hasRole } = useAuth();
  const isEpAdviseur = hasRole("ep_adviseur");
  const isAuditor = hasRole("auditor") || hasRole("beheer");

  const {
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
  } = useBatchVersturen(project, findings, onSent);

  // EP-adviseur paneel
  if (isEpAdviseur && wachtOpAdviseur.length > 0) {
    const klaar = adviseurKlaar;
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
    const klaar = auditorKlaar;
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