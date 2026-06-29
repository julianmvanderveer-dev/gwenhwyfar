CREATE OR REPLACE FUNCTION public.claim_project(_project_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projects
  SET toegewezen_aan = _user_id,
      toegewezen_op = now()
  WHERE id = _project_id
    AND toegewezen_aan IS NULL
    AND toewijzing = 'pool'
    AND NOT EXISTS (
      SELECT 1 FROM public.adviseurs a
      WHERE a.id = projects.adviseur_id
        AND a.user_id = _user_id
    );
  RETURN FOUND;
END;
$function$;