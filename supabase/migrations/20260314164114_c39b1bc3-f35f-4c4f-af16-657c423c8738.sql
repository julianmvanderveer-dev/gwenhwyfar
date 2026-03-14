CREATE OR REPLACE FUNCTION public.get_adviseur_aandachtspunten(_adviseur_id uuid, _exclude_project_id uuid)
RETURNS TABLE(controlepunt text, onderdeel text, aantal bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT f.controlepunt, f.onderdeel, COUNT(*) as aantal
  FROM public.findings f
  JOIN public.projects p ON p.id = f.project_id
  WHERE p.adviseur_id = _adviseur_id
    AND p.id != _exclude_project_id
    AND f.beoordeling = 'niet_goed'
  GROUP BY f.controlepunt, f.onderdeel
  ORDER BY aantal DESC
  LIMIT 5
$$;