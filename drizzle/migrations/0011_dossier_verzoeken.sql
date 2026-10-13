CREATE TABLE public.dossier_verzoeken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  aangevraagd_door uuid,
  aangevraagd_door_naam text,
  rol text,
  opmerking text,
  created_at timestamptz NOT NULL DEFAULT now(),
  gemeld_compleet_op timestamptz,
  gemeld_compleet_door uuid,
  afgehandeld_op timestamptz,
  afgehandeld_door uuid,
  afgehandeld_door_naam text
);
GRANT SELECT, INSERT, UPDATE ON public.dossier_verzoeken TO authenticated;
GRANT ALL ON public.dossier_verzoeken TO service_role;
ALTER TABLE public.dossier_verzoeken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intern leest dossierverzoeken" ON public.dossier_verzoeken FOR SELECT TO authenticated
USING (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[])
  OR EXISTS (SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
             WHERE p.id = project_id AND a.user_id = auth.uid()));

CREATE POLICY "Intern maakt dossierverzoeken" ON public.dossier_verzoeken FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]) AND aangevraagd_door = auth.uid());

CREATE POLICY "Intern werkt dossierverzoeken bij" ON public.dossier_verzoeken FOR UPDATE TO authenticated
USING (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]))
WITH CHECK (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]));

CREATE POLICY "Adviseur meldt dossier compleet" ON public.dossier_verzoeken FOR UPDATE TO authenticated
USING (afgehandeld_op IS NULL AND EXISTS (SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
             WHERE p.id = project_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
             WHERE p.id = project_id AND a.user_id = auth.uid()));

CREATE INDEX dossier_verzoeken_project_idx ON public.dossier_verzoeken(project_id);