CREATE OR REPLACE FUNCTION public.is_beoordelaar_van_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.findings f
    WHERE f.project_id = _project_id
      AND f.toegewezen_beoordelaar = auth.uid()
  )
$$;

DROP POLICY IF EXISTS "Projects select" ON public.projects;
CREATE POLICY "Projects select" ON public.projects
FOR SELECT
USING (
  has_role('beheer'::app_role)
  OR (
    has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
    AND (
      toegewezen_aan = auth.uid()
      OR (toewijzing = 'pool'::toewijzing_type AND toegewezen_aan IS NULL)
      OR public.is_beoordelaar_van_project(id)
    )
  )
  OR (
    has_role('ep_adviseur'::app_role)
    AND EXISTS (
      SELECT 1 FROM adviseurs
      WHERE adviseurs.id = projects.adviseur_id AND adviseurs.user_id = auth.uid()
    )
    AND (
      status = 'wacht_op_reactie'::project_status
      OR (status = ANY (ARRAY['afgerond'::project_status, 'gesloten'::project_status])
          AND gearchiveerd_op IS NOT NULL
          AND gearchiveerd_op >= (now() - '14 days'::interval))
    )
  )
);

DROP POLICY IF EXISTS "Projects update" ON public.projects;
CREATE POLICY "Projects update" ON public.projects
FOR UPDATE
USING (
  has_role('beheer'::app_role)
  OR (
    has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
    AND (
      toegewezen_aan = auth.uid()
      OR (toewijzing = 'pool'::toewijzing_type AND toegewezen_aan IS NULL)
      OR (status = ANY (ARRAY['afgerond'::project_status, 'gesloten'::project_status])
          AND public.is_beoordelaar_van_project(id))
    )
  )
);