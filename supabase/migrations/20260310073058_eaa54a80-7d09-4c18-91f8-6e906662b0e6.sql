
-- Add bijlage_pad column to messages
ALTER TABLE public.messages ADD COLUMN bijlage_pad text;

-- Create storage bucket for finding documents (max 10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('finding-documents', 'finding-documents', false, 10485760);

-- RLS: authenticated users with correct roles can upload
CREATE POLICY "Authenticated users upload finding docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'finding-documents'
  AND has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role])
);

-- RLS: authenticated users with correct roles can read
CREATE POLICY "Authenticated users read finding docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'finding-documents'
  AND has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role, 'ep_adviseur'::app_role])
);
