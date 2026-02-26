
-- Step 1: Update user_roles data BEFORE changing enums
DELETE FROM public.user_roles 
WHERE role = 'planner' 
AND user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'beheer');
UPDATE public.user_roles SET role = 'beheer' WHERE role = 'planner';

-- Step 2: Drop ALL RLS policies first (they depend on functions which depend on enum)
DROP POLICY IF EXISTS "Beheer mag adviseurs bewerken" ON public.adviseurs;
DROP POLICY IF EXISTS "Iedereen met rol mag adviseurs lezen" ON public.adviseurs;
DROP POLICY IF EXISTS "Findings delete" ON public.findings;
DROP POLICY IF EXISTS "Findings insert" ON public.findings;
DROP POLICY IF EXISTS "Findings select" ON public.findings;
DROP POLICY IF EXISTS "Findings update" ON public.findings;
DROP POLICY IF EXISTS "Messages delete" ON public.messages;
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
DROP POLICY IF EXISTS "Messages select" ON public.messages;
DROP POLICY IF EXISTS "Projects delete" ON public.projects;
DROP POLICY IF EXISTS "Projects insert" ON public.projects;
DROP POLICY IF EXISTS "Projects select" ON public.projects;
DROP POLICY IF EXISTS "Projects update" ON public.projects;
DROP POLICY IF EXISTS "Beheer manages roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS public.has_role(app_role);
DROP FUNCTION IF EXISTS public.has_any_role(app_role[]);

-- Step 4: Recreate app_role enum via temp column
ALTER TABLE public.user_roles ADD COLUMN role_text text;
UPDATE public.user_roles SET role_text = role::text;
ALTER TABLE public.user_roles DROP COLUMN role;

DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('beheer', 'tekenaar', 'auditor', 'ep_adviseur');

UPDATE public.user_roles SET role_text = 'auditor' WHERE role_text = 'ep_adviseur';
UPDATE public.user_roles SET role_text = 'ep_adviseur' WHERE role_text = 'adviseur';

ALTER TABLE public.user_roles ADD COLUMN role public.app_role NOT NULL DEFAULT 'ep_adviseur';
UPDATE public.user_roles SET role = role_text::public.app_role;
ALTER TABLE public.user_roles DROP COLUMN role_text;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Step 5: Recreate eigenaar_type enum
ALTER TABLE public.findings ADD COLUMN eigenaar_text text;
UPDATE public.findings SET eigenaar_text = eigenaar_beoordeling::text;
ALTER TABLE public.findings DROP COLUMN eigenaar_beoordeling;

DROP TYPE public.eigenaar_type;
CREATE TYPE public.eigenaar_type AS ENUM ('tekenaar', 'auditor');

UPDATE public.findings SET eigenaar_text = 'auditor' WHERE eigenaar_text = 'ep_adviseur';

ALTER TABLE public.findings ADD COLUMN eigenaar_beoordeling public.eigenaar_type;
UPDATE public.findings SET eigenaar_beoordeling = eigenaar_text::public.eigenaar_type WHERE eigenaar_text IS NOT NULL;
ALTER TABLE public.findings DROP COLUMN eigenaar_text;

-- Step 6: Recreate functions
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ANY(_roles)) $$;

-- Step 7: Recreate all RLS policies with new roles
CREATE POLICY "Beheer mag adviseurs bewerken" ON public.adviseurs FOR ALL TO authenticated
USING (has_role('beheer'::app_role)) WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Iedereen met rol mag adviseurs lezen" ON public.adviseurs FOR SELECT TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));

CREATE POLICY "Findings delete" ON public.findings FOR DELETE TO authenticated
USING (has_role('beheer'::app_role));

CREATE POLICY "Findings insert" ON public.findings FOR INSERT TO authenticated
WITH CHECK (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));

CREATE POLICY "Findings select" ON public.findings FOR SELECT TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (has_role('ep_adviseur'::app_role) AND zichtbaar_voor_adviseur = true
    AND EXISTS (SELECT 1 FROM projects JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid())));

CREATE POLICY "Findings update" ON public.findings FOR UPDATE TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (has_role('ep_adviseur'::app_role)
    AND EXISTS (SELECT 1 FROM projects JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid())));

CREATE POLICY "Messages delete" ON public.messages FOR DELETE TO authenticated
USING (has_role('beheer'::app_role));

CREATE POLICY "Messages insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (afzender_id = auth.uid() AND (
  has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (has_role('ep_adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM findings f JOIN projects p ON p.id = f.project_id JOIN adviseurs a ON a.id = p.adviseur_id
    WHERE f.id = messages.finding_id AND a.user_id = auth.uid()))));

CREATE POLICY "Messages select" ON public.messages FOR SELECT TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (has_role('ep_adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM findings f JOIN projects p ON p.id = f.project_id JOIN adviseurs a ON a.id = p.adviseur_id
    WHERE f.id = messages.finding_id AND a.user_id = auth.uid())));

CREATE POLICY "Projects delete" ON public.projects FOR DELETE TO authenticated
USING (has_role('beheer'::app_role));

CREATE POLICY "Projects insert" ON public.projects FOR INSERT TO authenticated
WITH CHECK (has_role('beheer'::app_role) AND aangemaakt_door = auth.uid());

CREATE POLICY "Projects select" ON public.projects FOR SELECT TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (has_role('ep_adviseur'::app_role) AND EXISTS (
    SELECT 1 FROM adviseurs WHERE adviseurs.id = projects.adviseur_id AND adviseurs.user_id = auth.uid())));

CREATE POLICY "Projects update" ON public.projects FOR UPDATE TO authenticated
USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));

CREATE POLICY "Beheer manages roles" ON public.user_roles FOR ALL TO authenticated
USING (has_role('beheer'::app_role)) WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role('beheer'::app_role));
