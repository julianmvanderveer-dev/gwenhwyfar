CREATE OR REPLACE FUNCTION public.get_mijn_fouten_top(_auditjaar text DEFAULT NULL, _limit integer DEFAULT 10)
RETURNS TABLE(
  onderdeel text,
  controlepunt text,
  aantal bigint,
  totaal_afwijkingen bigint,
  aantal_projecten bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH mijn AS (
    SELECT a.id FROM public.adviseurs a WHERE a.user_id = auth.uid()
  ),
  rel AS (
    SELECT f.onderdeel, f.controlepunt, f.project_id
    FROM public.findings f
    JOIN public.projects p ON p.id = f.project_id
    JOIN mijn m ON m.id = p.adviseur_id
    WHERE f.beoordeling = 'niet_goed'
      AND f.status IN ('reactie_goedgekeurd', 'gesloten')
      AND (f.concept_reactie IS NULL
           OR f.concept_reactie->>'type' IS NULL
           OR f.concept_reactie->>'type' = 'akkoord')
      AND (
        _auditjaar IS NULL
        OR COALESCE(
             p.auditjaar,
             CASE WHEN EXTRACT(MONTH FROM p.datum_aangemaakt) >= 7
               THEN EXTRACT(YEAR FROM p.datum_aangemaakt)::int::text || '-' || (EXTRACT(YEAR FROM p.datum_aangemaakt)::int + 1)::text
               ELSE (EXTRACT(YEAR FROM p.datum_aangemaakt)::int - 1)::text || '-' || EXTRACT(YEAR FROM p.datum_aangemaakt)::int::text
             END
           ) = _auditjaar
      )
  ),
  totalen AS (
    SELECT COUNT(*)::bigint AS totaal, COUNT(DISTINCT project_id)::bigint AS projecten FROM rel
  )
  SELECT r.onderdeel, r.controlepunt, COUNT(*)::bigint AS aantal, t.totaal, t.projecten
  FROM rel r CROSS JOIN totalen t
  GROUP BY r.onderdeel, r.controlepunt, t.totaal, t.projecten
  ORDER BY aantal DESC, r.controlepunt
  LIMIT GREATEST(COALESCE(_limit, 10), 1)
$$;

REVOKE ALL ON FUNCTION public.get_mijn_fouten_top(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mijn_fouten_top(text, integer) TO authenticated;