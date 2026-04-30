-- Datafix: projecten 107b en 107c hebben al hun aan de adviseur
-- gestuurde bevindingen goedgekeurd, maar hun status stond nog op
-- 'wacht_op_reactie'. Zet ze op 'afgerond' zodat ze in het overzicht
-- correct als afgeronde audit verschijnen.
UPDATE public.projects
SET status = 'afgerond',
    gearchiveerd_op = COALESCE(gearchiveerd_op, now())
WHERE id IN (
  '6bbca051-a35c-44ca-99c5-d0a3781a5f8f',
  '50db86bc-7e4f-4ff8-aea9-fce84199542e'
)
AND status = 'wacht_op_reactie'
AND NOT EXISTS (
  SELECT 1 FROM public.findings f
  WHERE f.project_id = projects.id
    AND f.zichtbaar_voor_adviseur = true
    AND f.status NOT IN ('reactie_goedgekeurd', 'gesloten')
);
