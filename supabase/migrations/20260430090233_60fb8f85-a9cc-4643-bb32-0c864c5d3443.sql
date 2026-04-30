ALTER TABLE public.findings
  ADD COLUMN IF NOT EXISTS concept_reactie jsonb,
  ADD COLUMN IF NOT EXISTS concept_beoordeling jsonb;