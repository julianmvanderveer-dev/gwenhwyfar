
-- 1. Add user_id column to adviseurs
ALTER TABLE public.adviseurs ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. Create auto-link trigger function
CREATE OR REPLACE FUNCTION public.link_user_to_adviseur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.adviseurs SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- 3. Trigger on profiles insert
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_user_to_adviseur();

-- 4. Fix RLS on projects: replace adviseur_id = auth.uid() with join via adviseurs
DROP POLICY IF EXISTS "Projects select" ON public.projects;
CREATE POLICY "Projects select" ON public.projects
FOR SELECT TO authenticated
USING (
  has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'beheer'::app_role])
  OR (has_role('adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM public.adviseurs
    WHERE adviseurs.id = projects.adviseur_id AND adviseurs.user_id = auth.uid()
  ))
);

-- 5. Fix RLS on findings select
DROP POLICY IF EXISTS "Findings select" ON public.findings;
CREATE POLICY "Findings select" ON public.findings
FOR SELECT TO authenticated
USING (
  has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'beheer'::app_role])
  OR (has_role('adviseur'::app_role) AND zichtbaar_voor_adviseur = true AND EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.adviseurs ON adviseurs.id = projects.adviseur_id
    WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid()
  ))
);

-- 6. Fix RLS on findings update
DROP POLICY IF EXISTS "Findings update" ON public.findings;
CREATE POLICY "Findings update" ON public.findings
FOR UPDATE TO authenticated
USING (
  has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'beheer'::app_role])
  OR (has_role('adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.adviseurs ON adviseurs.id = projects.adviseur_id
    WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid()
  ))
);

-- 7. Fix RLS on messages select
DROP POLICY IF EXISTS "Messages select" ON public.messages;
CREATE POLICY "Messages select" ON public.messages
FOR SELECT TO authenticated
USING (
  has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'beheer'::app_role])
  OR (has_role('adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM public.findings f
    JOIN public.projects p ON p.id = f.project_id
    JOIN public.adviseurs a ON a.id = p.adviseur_id
    WHERE f.id = messages.finding_id AND a.user_id = auth.uid()
  ))
);

-- 8. Fix RLS on messages insert
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
CREATE POLICY "Messages insert" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  afzender_id = auth.uid() AND (
    has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'beheer'::app_role])
    OR (has_role('adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE f.id = messages.finding_id AND a.user_id = auth.uid()
    ))
  )
);

-- 9. Adviseur select policy: adviseurs can also see their own record
DROP POLICY IF EXISTS "Iedereen met rol mag adviseurs lezen" ON public.adviseurs;
CREATE POLICY "Iedereen met rol mag adviseurs lezen" ON public.adviseurs
FOR SELECT TO authenticated
USING (
  has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'adviseur'::app_role, 'beheer'::app_role])
);
