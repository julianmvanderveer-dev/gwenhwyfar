DROP POLICY IF EXISTS "project-docs insert" ON storage.objects;
CREATE POLICY "project-docs insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN adviseurs a ON a.id = p.adviseur_id
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role,'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid() OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
);