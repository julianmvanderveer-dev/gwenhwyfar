CREATE OR REPLACE FUNCTION public.auto_finish_project_on_finding_close()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    ) AND EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE p.id = NEW.project_id
        AND a.email IS NOT NULL
        AND a.email <> ''
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
$function$;