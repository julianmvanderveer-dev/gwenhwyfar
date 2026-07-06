DROP POLICY IF EXISTS "Projects delete" ON public.projects;
CREATE POLICY "Projects delete" ON public.projects FOR DELETE USING (
  has_role('beheer'::app_role) OR has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
);