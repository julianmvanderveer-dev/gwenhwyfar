ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS auditjaar text;

UPDATE public.projects
SET auditjaar = CASE
  WHEN EXTRACT(MONTH FROM datum_aangemaakt) >= 7
    THEN EXTRACT(YEAR FROM datum_aangemaakt)::int || '-' || (EXTRACT(YEAR FROM datum_aangemaakt)::int + 1)
  ELSE (EXTRACT(YEAR FROM datum_aangemaakt)::int - 1) || '-' || EXTRACT(YEAR FROM datum_aangemaakt)::int
END
WHERE auditjaar IS NULL;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_auditjaar_format CHECK (auditjaar IS NULL OR auditjaar ~ '^[0-9]{4}-[0-9]{4}$');

CREATE INDEX IF NOT EXISTS idx_projects_auditjaar ON public.projects (auditjaar);