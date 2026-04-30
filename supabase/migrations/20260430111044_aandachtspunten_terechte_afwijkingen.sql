-- Filter "Aandachtspunten bij deze adviseur" zodat alleen terechte afwijkingen meetellen.
CREATE OR REPLACE FUNCTION public.get_adviseur_aandachtspunten(
  _adviseur_id uuid,
  _exclude_project_id uuid
)
RETURNS TABLE(controlepunt text, onderdeel text, aantal bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT f.controlepunt, f.onderdeel, COUNT(*) as aantal
  FROM public.findings f
  JOIN public.projects p ON p.id = f.project_id
  WHERE p.adviseur_id = _adviseur_id
    AND p.id != _exclude_project_id
    AND f.beoordeling = 'niet_goed'
    AND (
      f.status NOT IN ('reactie_goedgekeurd', 'gesloten')
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.adviseurs a ON a.user_id = m.afzender_id
        WHERE m.finding_id = f.id
          AND a.id = _adviseur_id
          AND TRIM(m.bericht) = 'Afwijking geaccepteerd'
      )
    )
  GROUP BY f.controlepunt, f.onderdeel
  ORDER BY aantal DESC
  LIMIT 5
$function$;
