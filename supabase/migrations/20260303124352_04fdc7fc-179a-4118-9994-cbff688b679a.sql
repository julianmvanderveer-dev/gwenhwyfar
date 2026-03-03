
-- Change default for new projects
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'nog_niet_begonnen'::project_status;

-- Migrate existing data
UPDATE public.projects SET status = 'nog_niet_begonnen' WHERE status = 'geselecteerd';
UPDATE public.projects SET status = 'deel1_afgerond' WHERE status = 'wacht_op_deel2';
UPDATE public.projects SET status = 'wacht_op_reactie' WHERE status = 'reactie_open';
