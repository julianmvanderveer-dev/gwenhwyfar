-- Create user_audit_categorieen junction table
CREATE TABLE public.user_audit_categorieen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audit_categorie public.audit_categorie NOT NULL,
  UNIQUE (user_id, audit_categorie)
);

ALTER TABLE public.user_audit_categorieen ENABLE ROW LEVEL SECURITY;

-- Beheer full access
CREATE POLICY "Beheer manages audit categorieen"
ON public.user_audit_categorieen
FOR ALL
TO authenticated
USING (public.has_role('beheer'::app_role))
WITH CHECK (public.has_role('beheer'::app_role));

-- Users can read own permissions
CREATE POLICY "Users see own audit categorieen"
ON public.user_audit_categorieen
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role('beheer'::app_role));