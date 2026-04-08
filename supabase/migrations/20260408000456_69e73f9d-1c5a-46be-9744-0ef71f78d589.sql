
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan settings lezen" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Beheer kan settings inserten" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (has_role('beheer'::app_role));
CREATE POLICY "Beheer kan settings updaten" ON public.app_settings FOR UPDATE TO authenticated USING (has_role('beheer'::app_role)) WITH CHECK (has_role('beheer'::app_role));
CREATE POLICY "Beheer kan settings deleten" ON public.app_settings FOR DELETE TO authenticated USING (has_role('beheer'::app_role));

INSERT INTO public.app_settings (key, value) VALUES 
  ('org_naam', 'bengcert'),
  ('org_logo_url', '');

INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);

CREATE POLICY "Beheer kan branding uploaden" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND has_role('beheer'::app_role));
CREATE POLICY "Beheer kan branding updaten" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND has_role('beheer'::app_role));
CREATE POLICY "Beheer kan branding deleten" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding' AND has_role('beheer'::app_role));
CREATE POLICY "Publiek lezen branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
