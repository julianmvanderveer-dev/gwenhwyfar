DROP POLICY IF EXISTS "Iedereen kan settings lezen" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated kan settings lezen" ON public.app_settings;

CREATE POLICY "App-rollen kunnen settings lezen"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  public.has_any_role(ARRAY['beheer','auditor','tekenaar','ep_adviseur']::app_role[])
);