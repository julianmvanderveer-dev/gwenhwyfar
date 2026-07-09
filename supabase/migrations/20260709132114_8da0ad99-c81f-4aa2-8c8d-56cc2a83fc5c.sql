
CREATE TABLE public.ep2_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_naam text,
  oude_status text,
  nieuwe_status text NOT NULL,
  reden text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ep2_status_history_project_id_idx ON public.ep2_status_history(project_id, created_at DESC);

GRANT SELECT, INSERT ON public.ep2_status_history TO authenticated;
GRANT ALL ON public.ep2_status_history TO service_role;

ALTER TABLE public.ep2_status_history ENABLE ROW LEVEL SECURITY;

-- Auditors en beheer mogen historie lezen; EP-adviseurs alleen van eigen projecten
CREATE POLICY "Auditor en beheer kunnen ep2 historie lezen"
ON public.ep2_status_history
FOR SELECT
TO authenticated
USING (
  public.has_any_role(ARRAY['auditor','beheer','tekenaar']::app_role[])
  OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.adviseurs a ON a.id = p.adviseur_id
    WHERE p.id = ep2_status_history.project_id AND a.user_id = auth.uid()
  )
);

-- Alleen auditor die niet de EP-adviseur van dit project is mag wijziging vastleggen
CREATE POLICY "Auditor kan ep2 historie invoegen"
ON public.ep2_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('auditor'::app_role)
  AND changed_by = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.adviseurs a ON a.id = p.adviseur_id
    WHERE p.id = ep2_status_history.project_id AND a.user_id = auth.uid()
  )
);
