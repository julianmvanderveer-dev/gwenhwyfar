-- 1) Trigger die projects.status automatisch op 'afgerond' zet zodra
-- de laatste voor de adviseur zichtbare bevinding op 'reactie_goedgekeurd'
-- of 'gesloten' staat. Dit dekt alle paden waarlangs een finding wordt
-- afgesloten (batch versturen én losse updates).
CREATE OR REPLACE FUNCTION public.auto_finish_project_on_finding_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('reactie_goedgekeurd', 'gesloten') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.project_id = NEW.project_id
        AND f.zichtbaar_voor_adviseur = true
        AND f.status NOT IN ('reactie_goedgekeurd', 'gesloten')
    ) AND EXISTS (
      SELECT 1 FROM public.findings f2
      WHERE f2.project_id = NEW.project_id
        AND f2.zichtbaar_voor_adviseur = true
    ) THEN
      UPDATE public.projects
      SET status = 'afgerond',
          gearchiveerd_op = COALESCE(gearchiveerd_op, now())
      WHERE id = NEW.project_id
        AND status = 'wacht_op_reactie';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_finish_project ON public.findings;
CREATE TRIGGER trg_auto_finish_project
AFTER UPDATE OF status ON public.findings
FOR EACH ROW
EXECUTE FUNCTION public.auto_finish_project_on_finding_close();

-- 2) Datafix: alle projecten die nu vastzitten op 'wacht_op_reactie'
-- terwijl alle adviseur-zichtbare bevindingen al goedgekeurd of gesloten zijn,
-- alsnog op 'afgerond' zetten.
UPDATE public.projects p
SET status = 'afgerond',
    gearchiveerd_op = COALESCE(p.gearchiveerd_op, now())
WHERE p.status = 'wacht_op_reactie'
  AND EXISTS (
    SELECT 1 FROM public.findings f
    WHERE f.project_id = p.id
      AND f.zichtbaar_voor_adviseur = true
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.findings f2
    WHERE f2.project_id = p.id
      AND f2.zichtbaar_voor_adviseur = true
      AND f2.status NOT IN ('reactie_goedgekeurd', 'gesloten')
  );