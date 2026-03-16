
-- Add reactie_goedgekeurd to finding_status enum
ALTER TYPE public.finding_status ADD VALUE IF NOT EXISTS 'reactie_goedgekeurd';

-- Add goedgekeurd_op column to findings
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS goedgekeurd_op TIMESTAMPTZ;

-- Update the check_all_findings_closed function to include reactie_goedgekeurd
CREATE OR REPLACE FUNCTION public.check_all_findings_closed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('gesloten', 'reactie_goedgekeurd') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.findings
      WHERE project_id = NEW.project_id AND status NOT IN ('gesloten', 'reactie_goedgekeurd')
    ) THEN
      UPDATE public.projects SET status = 'gesloten' WHERE id = NEW.project_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
