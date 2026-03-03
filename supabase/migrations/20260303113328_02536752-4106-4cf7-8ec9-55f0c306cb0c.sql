-- Fix: Ensure all RLS policies explicitly target 'authenticated' role
-- This prevents any theoretical anonymous access even though has_role() already blocks it

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Beheer sees all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Beheer updates profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Beheer sees all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role('beheer'::app_role));
CREATE POLICY "Beheer updates profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (has_role('beheer'::app_role));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ===== ADVISEURS =====
DROP POLICY IF EXISTS "Beheer mag adviseurs bewerken" ON public.adviseurs;
DROP POLICY IF EXISTS "Iedereen met rol mag adviseurs lezen" ON public.adviseurs;

CREATE POLICY "Beheer mag adviseurs bewerken" ON public.adviseurs
  FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));
CREATE POLICY "Iedereen met rol mag adviseurs lezen" ON public.adviseurs
  FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));

-- ===== USER_ROLES =====
DROP POLICY IF EXISTS "Beheer manages roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;

CREATE POLICY "Beheer manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR has_role('beheer'::app_role));

-- ===== PROJECTS =====
DROP POLICY IF EXISTS "Projects select" ON public.projects;
DROP POLICY IF EXISTS "Projects insert" ON public.projects;
DROP POLICY IF EXISTS "Projects update" ON public.projects;
DROP POLICY IF EXISTS "Projects delete" ON public.projects;

CREATE POLICY "Projects select" ON public.projects
  FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
    OR (has_role('ep_adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM adviseurs WHERE adviseurs.id = projects.adviseur_id AND adviseurs.user_id = auth.uid()
    )));
CREATE POLICY "Projects insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (has_role('beheer'::app_role) AND aangemaakt_door = auth.uid());
CREATE POLICY "Projects update" ON public.projects
  FOR UPDATE TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));
CREATE POLICY "Projects delete" ON public.projects
  FOR DELETE TO authenticated
  USING (has_role('beheer'::app_role));

-- ===== FINDINGS =====
DROP POLICY IF EXISTS "Findings select" ON public.findings;
DROP POLICY IF EXISTS "Findings insert" ON public.findings;
DROP POLICY IF EXISTS "Findings update" ON public.findings;
DROP POLICY IF EXISTS "Findings delete" ON public.findings;

CREATE POLICY "Findings select" ON public.findings
  FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
    OR (has_role('ep_adviseur'::app_role) AND zichtbaar_voor_adviseur = true AND EXISTS (
      SELECT 1 FROM projects JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid()
    )));
CREATE POLICY "Findings insert" ON public.findings
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));
CREATE POLICY "Findings update" ON public.findings
  FOR UPDATE TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
    OR (has_role('ep_adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM projects JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = findings.project_id AND adviseurs.user_id = auth.uid()
    )));
CREATE POLICY "Findings delete" ON public.findings
  FOR DELETE TO authenticated
  USING (has_role('beheer'::app_role));

-- ===== MESSAGES =====
DROP POLICY IF EXISTS "Messages select" ON public.messages;
DROP POLICY IF EXISTS "Messages insert" ON public.messages;
DROP POLICY IF EXISTS "Messages delete" ON public.messages;

CREATE POLICY "Messages select" ON public.messages
  FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
    OR (has_role('ep_adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM findings f JOIN projects p ON p.id = f.project_id JOIN adviseurs a ON a.id = p.adviseur_id
      WHERE f.id = messages.finding_id AND a.user_id = auth.uid()
    )));
CREATE POLICY "Messages insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (afzender_id = auth.uid() AND (
    has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
    OR (has_role('ep_adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM findings f JOIN projects p ON p.id = f.project_id JOIN adviseurs a ON a.id = p.adviseur_id
      WHERE f.id = messages.finding_id AND a.user_id = auth.uid()
    ))
  ));
CREATE POLICY "Messages delete" ON public.messages
  FOR DELETE TO authenticated
  USING (has_role('beheer'::app_role));

-- ===== CHECKLIST_TEMPLATES =====
DROP POLICY IF EXISTS "Checklist templates select" ON public.checklist_templates;
DROP POLICY IF EXISTS "Checklist templates manage" ON public.checklist_templates;

CREATE POLICY "Checklist templates select" ON public.checklist_templates
  FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));
CREATE POLICY "Checklist templates manage" ON public.checklist_templates
  FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));