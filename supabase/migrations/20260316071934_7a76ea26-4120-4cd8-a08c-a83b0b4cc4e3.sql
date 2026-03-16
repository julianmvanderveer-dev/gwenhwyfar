DROP POLICY "Projects insert" ON public.projects;
CREATE POLICY "Projects insert" ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  AND aangemaakt_door = auth.uid()
);