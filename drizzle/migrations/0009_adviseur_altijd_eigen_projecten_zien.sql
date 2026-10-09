DROP POLICY "Projects select" ON public.projects;

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
      OR is_beoordelaar_van_project(id)
    )
  )
  OR (
    has_role('ep_adviseur'::app_role)
    AND EXISTS (
      SELECT 1 FROM adviseurs
      WHERE adviseurs.id = projects.adviseur_id
        AND adviseurs.user_id = auth.uid()
    )
  )
);