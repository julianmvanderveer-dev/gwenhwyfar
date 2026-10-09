DROP POLICY "Project documenten toevoegen" ON public.project_documenten;

CREATE POLICY "Project documenten toevoegen"
ON public.project_documenten
FOR INSERT
TO authenticated
WITH CHECK (
  geupload_door = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_documenten.project_id
      AND p.status = 'wacht_op_reactie'
  )
  AND (
    public.has_any_role(ARRAY['beheer'::app_role, 'auditor'::app_role, 'tekenaar'::app_role])
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE p.id = project_documenten.project_id
        AND a.user_id = auth.uid()
    )
  )
);