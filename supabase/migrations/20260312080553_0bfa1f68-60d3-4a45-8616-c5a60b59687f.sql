
-- 1. Enum voor toewijzingstype
CREATE TYPE public.toewijzing_type AS ENUM ('specifiek', 'pool');

-- 2. Nieuwe kolommen op projects
ALTER TABLE public.projects
  ADD COLUMN toewijzing public.toewijzing_type NOT NULL DEFAULT 'pool',
  ADD COLUMN toegewezen_aan uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN toegewezen_op timestamptz;

-- 3. Atomische claim-functie (voorkomt race conditions)
CREATE OR REPLACE FUNCTION public.claim_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET toegewezen_aan = _user_id,
      toegewezen_op = now()
  WHERE id = _project_id
    AND toegewezen_aan IS NULL
    AND toewijzing = 'pool'
    AND status = 'nog_niet_begonnen';
  RETURN FOUND;
END;
$$;

-- 4. Notificaties tabel
CREATE TABLE public.notificaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bericht text NOT NULL,
  gelezen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigen notificaties lezen" ON public.notificaties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Eigen notificaties updaten" ON public.notificaties
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Beheer en systeem kunnen notificaties aanmaken" ON public.notificaties
  FOR INSERT TO authenticated
  WITH CHECK (has_role('beheer'::app_role));

-- 5. Update RLS: tekenaars/auditors zien alleen toegewezen of pool-projecten
DROP POLICY IF EXISTS "Projects select" ON public.projects;

CREATE POLICY "Projects select" ON public.projects
  FOR SELECT TO authenticated
  USING (
    has_role('beheer'::app_role)
    OR (
      has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
      AND (
        toegewezen_aan = auth.uid()
        OR (toewijzing = 'pool' AND toegewezen_aan IS NULL)
      )
    )
    OR (
      has_role('ep_adviseur'::app_role)
      AND EXISTS (
        SELECT 1 FROM adviseurs
        WHERE adviseurs.id = projects.adviseur_id
        AND adviseurs.user_id = auth.uid()
      )
    )
  );
