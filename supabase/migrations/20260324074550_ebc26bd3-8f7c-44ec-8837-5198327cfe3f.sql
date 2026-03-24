
-- Tabel project_uitdraai
CREATE TABLE public.project_uitdraai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text,
  status text NOT NULL DEFAULT 'uploading',
  extracted_data jsonb DEFAULT '{}',
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_uitdraai ENABLE ROW LEVEL SECURITY;

-- Beheer/tekenaar/auditor mogen CRUD
CREATE POLICY "Interne rollen mogen uitdraai beheren" ON public.project_uitdraai FOR ALL TO authenticated
  USING (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]))
  WITH CHECK (has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));

-- EP-adviseur mag lezen
CREATE POLICY "EP-adviseur mag uitdraai lezen" ON public.project_uitdraai FOR SELECT TO authenticated
  USING (
    has_role('ep_adviseur'::app_role) AND EXISTS (
      SELECT 1 FROM projects
      JOIN adviseurs ON adviseurs.id = projects.adviseur_id
      WHERE projects.id = project_uitdraai.project_id AND adviseurs.user_id = auth.uid()
    )
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Storage RLS: interne rollen mogen uploaden/lezen
CREATE POLICY "Interne rollen mogen documenten uploaden" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role]));

CREATE POLICY "Interne rollen mogen documenten lezen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-documents' AND has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role]));
