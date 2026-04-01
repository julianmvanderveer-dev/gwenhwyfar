DROP POLICY IF EXISTS "Beheer en systeem kunnen notificaties aanmaken" ON public.notificaties;
CREATE POLICY "Interne rollen kunnen notificaties aanmaken"
ON public.notificaties
FOR INSERT
TO authenticated
WITH CHECK (has_any_role(ARRAY['beheer'::app_role, 'auditor'::app_role, 'tekenaar'::app_role]));