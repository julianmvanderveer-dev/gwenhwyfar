
-- 1. Tighten externe_rapportages SELECT for ep_adviseur
DROP POLICY IF EXISTS "Interne rollen mogen externe rapportages lezen" ON public.externe_rapportages;
CREATE POLICY "Interne rollen mogen externe rapportages lezen"
ON public.externe_rapportages
FOR SELECT
USING (
  has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  OR (
    has_role('ep_adviseur'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE p.id = externe_rapportages.project_id
        AND a.user_id = auth.uid()
    )
  )
);

-- 2. Restrict projects UPDATE to assigned/pool
DROP POLICY IF EXISTS "Projects update" ON public.projects;
CREATE POLICY "Projects update"
ON public.projects
FOR UPDATE
USING (
  has_role('beheer'::app_role)
  OR (
    has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
    AND (
      toegewezen_aan = auth.uid()
      OR (toewijzing = 'pool'::toewijzing_type AND toegewezen_aan IS NULL)
    )
  )
);

-- 3. Explicit UPDATE policies on storage buckets
DROP POLICY IF EXISTS "finding-docs update" ON storage.objects;
CREATE POLICY "finding-docs update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'finding-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      LEFT JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE (f.id)::text = (storage.foldername(objects.name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid()
                 OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
)
WITH CHECK (
  bucket_id = 'finding-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      LEFT JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE (f.id)::text = (storage.foldername(objects.name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid()
                 OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
);

DROP POLICY IF EXISTS "project-docs update" ON storage.objects;
CREATE POLICY "project-docs update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (p.id)::text = (storage.foldername(objects.name))[1]
        AND has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
        AND (p.toegewezen_aan = auth.uid()
             OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL))
    )
  )
)
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (p.id)::text = (storage.foldername(objects.name))[1]
        AND has_any_role(ARRAY['tekenaar'::app_role, 'auditor'::app_role])
        AND (p.toegewezen_aan = auth.uid()
             OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL))
    )
  )
);

-- 4. Revoke anon EXECUTE on SECURITY DEFINER helpers (keep has_role/has_any_role public for RLS)
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_adviseur_aandachtspunten(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_user_to_adviseur() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_finish_project_on_finding_close() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_all_findings_closed() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_project(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_adviseur_aandachtspunten(uuid, uuid) TO authenticated;
