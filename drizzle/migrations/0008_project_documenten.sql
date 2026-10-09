CREATE TABLE public.project_documenten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text NOT NULL,
  omschrijving text,
  geupload_door uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_documenten TO authenticated;
GRANT ALL ON public.project_documenten TO service_role;
ALTER TABLE public.project_documenten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project documenten lezen" ON public.project_documenten FOR SELECT TO authenticated
USING (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]) OR EXISTS (
  SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
  WHERE p.id = project_documenten.project_id AND a.user_id = auth.uid()));

CREATE POLICY "Project documenten toevoegen" ON public.project_documenten FOR INSERT TO authenticated
WITH CHECK (geupload_door = auth.uid() AND (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]) OR EXISTS (
  SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
  WHERE p.id = project_documenten.project_id AND a.user_id = auth.uid())));

CREATE POLICY "Project documenten verwijderen beheer" ON public.project_documenten FOR DELETE TO authenticated
USING (public.has_role('beheer'::app_role));

DROP POLICY IF EXISTS "finding-docs select" ON storage.objects;
CREATE POLICY "finding-docs select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'finding-documents' AND (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]) OR EXISTS (
  SELECT 1 FROM public.findings f JOIN public.projects p ON p.id = f.project_id JOIN public.adviseurs a ON a.id = p.adviseur_id
  WHERE f.id::text = (storage.foldername(objects.name))[1] AND a.user_id = auth.uid())));

DROP POLICY IF EXISTS "project-docs select" ON storage.objects;
CREATE POLICY "project-docs select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-documents' AND (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]) OR EXISTS (
  SELECT 1 FROM public.projects p JOIN public.adviseurs a ON a.id = p.adviseur_id
  WHERE p.id::text = (storage.foldername(objects.name))[1] AND a.user_id = auth.uid())));