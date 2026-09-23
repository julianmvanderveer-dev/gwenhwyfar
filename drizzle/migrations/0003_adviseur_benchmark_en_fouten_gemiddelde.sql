DROP FUNCTION IF EXISTS public.get_mijn_fouten_top(text, integer);

CREATE OR REPLACE FUNCTION public.get_mijn_fouten_top(_auditjaar text DEFAULT NULL::text, _limit integer DEFAULT 10)
 RETURNS TABLE(onderdeel text, controlepunt text, aantal bigint, totaal_afwijkingen bigint, aantal_projecten bigint, gemiddeld_bij_anderen numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mijn AS (
    SELECT a.id FROM public.adviseurs a WHERE a.user_id = auth.uid()
  ),
  alle AS (
    SELECT f.onderdeel, f.controlepunt, f.project_id, p.adviseur_id
    FROM public.findings f
    JOIN public.projects p ON p.id = f.project_id
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
  rel AS (
    SELECT a.* FROM alle a JOIN mijn m ON m.id = a.adviseur_id
  ),
  anderen AS (
    SELECT a.onderdeel, a.controlepunt,
           COUNT(*)::numeric / NULLIF(COUNT(DISTINCT a.adviseur_id), 0) AS gem
    FROM alle a
    WHERE a.adviseur_id IS NOT NULL
      AND a.adviseur_id NOT IN (SELECT id FROM mijn)
    GROUP BY a.onderdeel, a.controlepunt
  ),
  totalen AS (
    SELECT COUNT(*)::bigint AS totaal, COUNT(DISTINCT project_id)::bigint AS projecten FROM rel
  )
  SELECT r.onderdeel, r.controlepunt, COUNT(*)::bigint AS aantal, t.totaal, t.projecten,
         ROUND(COALESCE(an.gem, 0), 1) AS gemiddeld_bij_anderen
  FROM rel r
  CROSS JOIN totalen t
  LEFT JOIN anderen an ON an.onderdeel = r.onderdeel AND an.controlepunt = r.controlepunt
  GROUP BY r.onderdeel, r.controlepunt, t.totaal, t.projecten, an.gem
  ORDER BY aantal DESC, r.controlepunt
  LIMIT GREATEST(COALESCE(_limit, 10), 1)
$function$;

GRANT EXECUTE ON FUNCTION public.get_mijn_fouten_top(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_mijn_benchmark(_auditjaar text DEFAULT NULL::text)
 RETURNS TABLE(
   mijn_projecten bigint,
   mijn_afwijkingen bigint,
   mijn_gem_per_project numeric,
   mijn_pct_schoon numeric,
   bench_gem_per_project numeric,
   bench_pct_schoon numeric,
   bench_top25_gem_per_project numeric,
   mijn_percentiel numeric,
   aantal_adviseurs integer
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mijn AS (
    SELECT a.id FROM public.adviseurs a WHERE a.user_id = auth.uid()
  ),
  proj AS (
    SELECT p.id, p.adviseur_id
    FROM public.projects p
    WHERE p.adviseur_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.findings f WHERE f.project_id = p.id)
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
  per_project AS (
    SELECT pr.id, pr.adviseur_id,
      (SELECT COUNT(*) FROM public.findings f
        WHERE f.project_id = pr.id
          AND f.beoordeling = 'niet_goed'
          AND f.status IN ('reactie_goedgekeurd', 'gesloten')
          AND (f.concept_reactie IS NULL
               OR f.concept_reactie->>'type' IS NULL
               OR f.concept_reactie->>'type' = 'akkoord')
      )::numeric AS afw
    FROM proj pr
  ),
  per_adviseur AS (
    SELECT adviseur_id,
           COUNT(*)::bigint AS projecten,
           SUM(afw)::bigint AS afwijkingen,
           ROUND(AVG(afw), 2) AS gem,
           ROUND(100.0 * COUNT(*) FILTER (WHERE afw = 0) / COUNT(*), 0) AS pct_schoon
    FROM per_project
    GROUP BY adviseur_id
  ),
  eigen AS (
    SELECT * FROM per_adviseur WHERE adviseur_id IN (SELECT id FROM mijn)
  ),
  stats AS (
    SELECT COUNT(*)::int AS n,
           ROUND(AVG(gem), 2) AS gem_avg,
           ROUND(AVG(pct_schoon), 0) AS pct_avg,
           ROUND(percentile_cont(0.25) WITHIN GROUP (ORDER BY gem)::numeric, 2) AS p25
    FROM per_adviseur
  )
  SELECT
    COALESCE(e.projecten, 0),
    COALESCE(e.afwijkingen, 0),
    COALESCE(e.gem, 0),
    COALESCE(e.pct_schoon, 0),
    CASE WHEN s.n >= 5 THEN s.gem_avg END,
    CASE WHEN s.n >= 5 THEN s.pct_avg END,
    CASE WHEN s.n >= 5 THEN s.p25 END,
    CASE WHEN s.n >= 5 AND e.gem IS NOT NULL THEN
      ROUND(100.0 * (SELECT COUNT(*) FROM per_adviseur pa WHERE pa.gem > e.gem) / s.n, 0)
    END,
    s.n
  FROM stats s
  LEFT JOIN eigen e ON true
$function$;

GRANT EXECUTE ON FUNCTION public.get_mijn_benchmark(text) TO authenticated;