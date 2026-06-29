import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useBatchVersturen } from "@/hooks/useBatchVersturen";
import { useProjectRole } from "@/hooks/useProjectRole";

type Finding = Tables<"findings">;
type Project = Tables<"projects">;

interface Props {
  projectId: string;
  /** Wanneer true, navigeert na succesvol versturen terug naar het projectoverzicht. */
  navigateOnSent?: boolean;
  onSent?: () => void;
  /** Bump om project + findings opnieuw te laden vanuit de parent (bijv. na opslaan reactie). */
  refreshSignal?: number;
}

/**
 * Compacte verzendbalk voor op de individuele bevinding-pagina.
 * Hergebruikt dezelfde batchlogica als het paneel op het projectoverzicht,
 * maar laadt zelf de bijbehorende project- en findings-data.
 */
export default function BatchVersturenCompact({
  projectId,
  navigateOnSent = true,
  onSent,
  refreshSignal = 0,
}: Props) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const { magAdviseurActiesDoen, magAuditorActiesDoen } = useProjectRole(projectId);
  const isEpAdviseur = magAdviseurActiesDoen;
  const isAuditor = magAuditorActiesDoen;

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: p }, { data: f }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
        supabase.from("findings").select("*").eq("project_id", projectId),
      ]);
      if (!active) return;
      setProject((p as Project) ?? null);
      setFindings((f as Finding[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [projectId, reloadKey, refreshSignal]);

  const handleSent = () => {
    onSent?.();
    if (navigateOnSent) {
      navigate(`/project/${projectId}`);
    } else {
      setReloadKey((k) => k + 1);
    }
  };

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
  } = useBatchVersturen(project, findings, handleSent);

  if (!project) return null;

  // EP-adviseur balk
  if (isEpAdviseur && wachtOpAdviseur.length > 0) {
    const klaar = adviseurKlaar;
    const solo = wachtOpAdviseur.length === 1;
    return (
      <div className="border rounded-lg bg-muted/40 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {adviseurConcepten.length}/{wachtOpAdviseur.length}
            </span>{" "}
            reactie(s) klaar in dit project.
            {!klaar && " Vul ook de overige reacties in om te kunnen versturen."}
          </p>
          <Button
            onClick={verstuurAdviseur}
            disabled={!klaar || busy}
            size="sm"
            className="gap-2 shrink-0"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {solo ? "Reactie nu versturen" : "Alle reacties nu versturen"}
          </Button>
        </div>
      </div>
    );
  }

  // Auditor balk
  if (isAuditor && wachtOpAuditor.length > 0) {
    const klaar = auditorKlaar;
    const solo = wachtOpAuditor.length === 1;
    return (
      <div className="border rounded-lg bg-muted/40 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {auditorConcepten.length}/{wachtOpAuditor.length}
            </span>{" "}
            beoordeling(en) klaar
            {auditorConcepten.length > 0 &&
              ` (${akkoordCount} goedgekeurd, ${nietAkkoordCount} niet akkoord)`}
            .
            {!klaar && " Beoordeel ook de overige reacties om te kunnen versturen."}
          </p>
          <Button
            onClick={verstuurAuditor}
            disabled={!klaar || busy}
            size="sm"
            className="gap-2 shrink-0"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {solo ? "Beoordeling nu versturen" : "Alle beoordelingen nu versturen"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}