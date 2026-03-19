
-- 1. Sectoren tabel
CREATE TABLE public.sectoren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  naam text NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sectoren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheer mag sectoren beheren" ON public.sectoren FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Interne rollen mogen sectoren lezen" ON public.sectoren FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));

-- 2. Sector koppeling op checklist_templates
ALTER TABLE public.checklist_templates ADD COLUMN sector_id uuid REFERENCES public.sectoren(id);

-- 3. Modules tabel
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  naam text NOT NULL,
  beschrijving text,
  actief boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheer mag modules beheren" ON public.modules FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Interne rollen mogen modules lezen" ON public.modules FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));

-- 4. Externe rapportages tabel
CREATE TABLE public.externe_rapportages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text,
  bron text,
  status text NOT NULL DEFAULT 'nieuw',
  metadata jsonb DEFAULT '{}',
  geimporteerd_door uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.externe_rapportages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beheer mag externe rapportages beheren" ON public.externe_rapportages FOR ALL TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Interne rollen mogen externe rapportages lezen" ON public.externe_rapportages FOR SELECT TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));

-- 5. Seed modules
INSERT INTO public.modules (code, naam, beschrijving) VALUES
  ('personeelsdossier', 'Personeelsdossiers', 'Beheer van personeelsdossiers en certificeringen'),
  ('bureau_audit', 'Bureau-audits', 'Interne bureau-audits en kwaliteitscontroles'),
  ('mobiele_opname', 'Mobiele opname', 'Mobiele opname en foto-registratie op locatie'),
  ('externe_rapportage', 'Externe rapportages', 'Inlezen en verwerken van externe rapportages');
