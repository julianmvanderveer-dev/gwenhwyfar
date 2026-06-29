import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Bepaalt de "effectieve" rol van de huidige gebruiker op één specifiek project.
 *
 * Functiescheiding: ben je de EP-adviseur van dit project, dan kun je op
 * datzelfde project geen auditor- of beoordelingsacties uitvoeren — ook al
 * heb je globaal de rol auditor of beheer. Beheer + auditor blijven verder
 * gewoon bij elkaar.
 */
export function useProjectRole(projectId: string | null | undefined) {
  const { user, hasRole } = useAuth();
  const [adviseurUserId, setAdviseurUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setAdviseurUserId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("adviseurs:adviseur_id(user_id)")
        .eq("id", projectId)
        .maybeSingle();
      if (!active) return;
      setAdviseurUserId(((data as any)?.adviseurs?.user_id as string) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  const isAdviseurVanProject = !!user && !!adviseurUserId && adviseurUserId === user.id;
  const magAuditorActiesDoen =
    (hasRole("auditor") || hasRole("beheer")) && !isAdviseurVanProject;
  const magAdviseurActiesDoen = isAdviseurVanProject;

  return { isAdviseurVanProject, magAuditorActiesDoen, magAdviseurActiesDoen, loading };
}