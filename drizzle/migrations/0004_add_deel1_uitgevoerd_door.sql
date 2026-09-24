ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deel1_uitgevoerd_door uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS deel1_afgerond_op timestamptz;

-- Backfill: aanmaker van het project als uitvoerder van deel 1
UPDATE public.projects p
SET deel1_uitgevoerd_door = p.aangemaakt_door
WHERE p.deel1_uitgevoerd_door IS NULL
  AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.aangemaakt_door);