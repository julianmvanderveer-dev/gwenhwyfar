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
    AND toewijzing = 'pool';
  RETURN FOUND;
END;
$function$;