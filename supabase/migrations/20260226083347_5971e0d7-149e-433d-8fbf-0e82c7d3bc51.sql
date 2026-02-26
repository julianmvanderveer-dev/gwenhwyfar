
-- Enums
CREATE TYPE public.app_role AS ENUM ('planner', 'tekenaar', 'ep_adviseur', 'adviseur', 'beheer');
CREATE TYPE public.project_status AS ENUM ('geselecteerd', 'deel1_bezig', 'wacht_op_deel2', 'afgerond', 'reactie_open', 'gesloten');
CREATE TYPE public.audit_type AS ENUM ('intern', 'extern');
CREATE TYPE public.beoordeling_type AS ENUM ('goed', 'niet_goed', 'interne_alert');
CREATE TYPE public.afwijking_type AS ENUM ('kritiek', 'niet_kritiek');
CREATE TYPE public.eigenaar_type AS ENUM ('tekenaar', 'ep_adviseur');
CREATE TYPE public.finding_status AS ENUM ('open', 'reactie_ontvangen', 'gesloten');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  email TEXT NOT NULL,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectnaam TEXT NOT NULL,
  adviseur_id UUID REFERENCES public.profiles(id),
  audit_type audit_type NOT NULL DEFAULT 'intern',
  prioriteit BOOLEAN NOT NULL DEFAULT false,
  status project_status NOT NULL DEFAULT 'geselecteerd',
  aangemaakt_door UUID NOT NULL REFERENCES auth.users(id),
  datum_aangemaakt TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Findings
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  onderdeel TEXT NOT NULL,
  controlepunt TEXT NOT NULL,
  beoordeling beoordeling_type,
  type_afwijking afwijking_type,
  deadline TIMESTAMPTZ,
  eigenaar_beoordeling eigenaar_type,
  status finding_status NOT NULL DEFAULT 'open',
  zichtbaar_voor_adviseur BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  afzender_id UUID NOT NULL REFERENCES auth.users(id),
  bericht TEXT NOT NULL,
  datum TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = ANY(_roles)
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, naam, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'naam', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-close project when all findings are closed
CREATE OR REPLACE FUNCTION public.check_all_findings_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'gesloten' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.findings
      WHERE project_id = NEW.project_id AND status != 'gesloten'
    ) THEN
      UPDATE public.projects SET status = 'gesloten' WHERE id = NEW.project_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_finding_status_change
  AFTER UPDATE OF status ON public.findings
  FOR EACH ROW EXECUTE FUNCTION public.check_all_findings_closed();

-- RLS Policies

-- Profiles: all authenticated can read
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- User roles: users see own, beheer sees all
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role('beheer'));

CREATE POLICY "Beheer manages roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role('beheer')) WITH CHECK (public.has_role('beheer'));

-- Projects
CREATE POLICY "Projects select" ON public.projects
  FOR SELECT TO authenticated USING (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
    OR adviseur_id = auth.uid()
  );

CREATE POLICY "Projects insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (
    public.has_any_role(ARRAY['planner','beheer']::app_role[])
    AND aangemaakt_door = auth.uid()
  );

CREATE POLICY "Projects update" ON public.projects
  FOR UPDATE TO authenticated USING (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
  );

CREATE POLICY "Projects delete" ON public.projects
  FOR DELETE TO authenticated USING (
    public.has_any_role(ARRAY['planner','beheer']::app_role[])
  );

-- Findings
CREATE POLICY "Findings select" ON public.findings
  FOR SELECT TO authenticated USING (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
    OR (public.has_role('adviseur') AND EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND adviseur_id = auth.uid()
    ) AND zichtbaar_voor_adviseur = true)
  );

CREATE POLICY "Findings insert" ON public.findings
  FOR INSERT TO authenticated WITH CHECK (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
  );

CREATE POLICY "Findings update" ON public.findings
  FOR UPDATE TO authenticated USING (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
    OR (public.has_role('adviseur') AND EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND adviseur_id = auth.uid()
    ))
  );

CREATE POLICY "Findings delete" ON public.findings
  FOR DELETE TO authenticated USING (
    public.has_any_role(ARRAY['planner','beheer']::app_role[])
  );

-- Messages
CREATE POLICY "Messages select" ON public.messages
  FOR SELECT TO authenticated USING (
    public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
    OR (public.has_role('adviseur') AND EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      WHERE f.id = finding_id AND p.adviseur_id = auth.uid()
    ))
  );

CREATE POLICY "Messages insert" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    afzender_id = auth.uid() AND (
      public.has_any_role(ARRAY['planner','tekenaar','ep_adviseur','beheer']::app_role[])
      OR (public.has_role('adviseur') AND EXISTS (
        SELECT 1 FROM public.findings f
        JOIN public.projects p ON p.id = f.project_id
        WHERE f.id = finding_id AND p.adviseur_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Messages delete" ON public.messages
  FOR DELETE TO authenticated USING (public.has_role('beheer'));
