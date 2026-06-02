
-- 1) Lock down email queue helper functions: set search_path
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pgmq'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pgmq'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pgmq'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pgmq'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

-- 2) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_user_to_adviseur() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_all_findings_closed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_finish_project_on_finding_close() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_project(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_adviseur_aandachtspunten(uuid, uuid) FROM PUBLIC, anon;

-- 3) Prevent self-insert/update/delete on user_roles (only beheer can mutate)
CREATE POLICY "Only beheer can insert roles" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Only beheer can update roles" ON public.user_roles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));

CREATE POLICY "Only beheer can delete roles" ON public.user_roles
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (has_role('beheer'::app_role));

-- 4) Restrict app_settings SELECT to authenticated users
DROP POLICY IF EXISTS "Iedereen kan settings lezen" ON public.app_settings;
CREATE POLICY "Authenticated kan settings lezen" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- 5) Storage: tighten finding-documents and project-documents with ownership checks + delete policies

-- Drop existing broad policies
DROP POLICY IF EXISTS "Authenticated users read finding docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload finding docs" ON storage.objects;
DROP POLICY IF EXISTS "Interne rollen mogen documenten lezen" ON storage.objects;
DROP POLICY IF EXISTS "Interne rollen mogen documenten uploaden" ON storage.objects;

-- finding-documents: path = {finding_id}/...
CREATE POLICY "finding-docs select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'finding-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      LEFT JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE f.id::text = (storage.foldername(name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role,'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid()
                 OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
);

CREATE POLICY "finding-docs insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'finding-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.projects p ON p.id = f.project_id
      LEFT JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE f.id::text = (storage.foldername(name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role,'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid()
                 OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
);

CREATE POLICY "finding-docs delete beheer"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'finding-documents' AND has_role('beheer'::app_role));

-- project-documents: path = {project_id}/...
CREATE POLICY "project-docs select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE p.id::text = (storage.foldername(name))[1]
        AND (
          (has_any_role(ARRAY['tekenaar'::app_role,'auditor'::app_role])
            AND (p.toegewezen_aan = auth.uid()
                 OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL)))
          OR (has_role('ep_adviseur'::app_role) AND a.user_id = auth.uid())
        )
    )
  )
);

CREATE POLICY "project-docs insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    has_role('beheer'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND has_any_role(ARRAY['tekenaar'::app_role,'auditor'::app_role])
        AND (p.toegewezen_aan = auth.uid()
             OR (p.toewijzing = 'pool'::toewijzing_type AND p.toegewezen_aan IS NULL))
    )
  )
);

CREATE POLICY "project-docs delete beheer"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-documents' AND has_role('beheer'::app_role));
