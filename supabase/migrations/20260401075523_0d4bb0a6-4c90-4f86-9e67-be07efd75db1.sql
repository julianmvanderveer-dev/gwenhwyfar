
DROP POLICY "Findings select" ON public.findings;

CREATE POLICY "Findings select"
ON public.findings
FOR SELECT
TO authenticated
USING (
  has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (
    has_role('ep_adviseur'::app_role)
    AND EXISTS (
      SELECT 1
      FROM projects
      JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = findings.project_id
        AND adviseurs.user_id = auth.uid()
    )
  )
);
