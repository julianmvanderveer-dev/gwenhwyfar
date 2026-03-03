
-- Step 1: Add new enum values
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'nog_niet_begonnen';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'deel1_afgerond';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'deel2_bezig';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'wacht_op_reactie';

-- Step 2: Add new columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reactie_deadline timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS gearchiveerd_op timestamptz;
