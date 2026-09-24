CREATE POLICY "Beheer beheert berichtbijlagen" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'adviseur-berichten' AND public.has_role('beheer'))
  WITH CHECK (bucket_id = 'adviseur-berichten' AND public.has_role('beheer'));
CREATE POLICY "Adviseur leest berichtbijlagen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'adviseur-berichten' AND EXISTS (SELECT 1 FROM public.adviseur_berichten b WHERE b.bijlage_pad = storage.objects.name));