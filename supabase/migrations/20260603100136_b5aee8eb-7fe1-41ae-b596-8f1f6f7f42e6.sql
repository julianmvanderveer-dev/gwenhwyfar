DROP POLICY IF EXISTS "Projects select" ON public.projects;

CREATE POLICY "Projects select"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role('beheer'::app_role)
  OR (
    has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
    AND (
      toegewezen_aan = auth.uid()
      OR (toewijzing = 'pool'::toewijzing_type AND toegewezen_aan IS NULL)
    )
  )
  OR (
    has_role('ep_adviseur'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.adviseurs
      WHERE adviseurs.id = projects.adviseur_id
        AND adviseurs.user_id = auth.uid()
    )
    AND (
      projects.status = 'wacht_op_reactie'::project_status
      OR (
        projects.status IN ('afgerond'::project_status, 'gesloten'::project_status)
        AND projects.gearchiveerd_op IS NOT NULL
        AND projects.gearchiveerd_op >= now() - interval '14 days'
      )
    )
  )
);