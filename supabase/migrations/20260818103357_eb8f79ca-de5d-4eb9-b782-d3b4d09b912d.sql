CREATE TABLE public.herafmeldingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text NOT NULL,
  toelichting text,
  status text NOT NULL DEFAULT 'ingediend',
  afkeur_reden text,
  ingediend_door uuid REFERENCES public.profiles(id),
  beoordeeld_door uuid REFERENCES public.profiles(id),
  beoordeeld_op timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.herafmeldingen TO authenticated;
GRANT ALL ON public.herafmeldingen TO service_role;

ALTER TABLE public.herafmeldingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intern personeel kan herafmeldingen lezen"
ON public.herafmeldingen FOR SELECT TO authenticated
USING (
  public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[])
  OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.adviseurs a ON a.id = p.adviseur_id
    WHERE p.id = herafmeldingen.project_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "EP-adviseur van project kan herafmelding indienen"
ON public.herafmeldingen FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[])
  OR EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.adviseurs a ON a.id = p.adviseur_id
    WHERE p.id = herafmeldingen.project_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Intern personeel kan herafmelding beoordelen"
ON public.herafmeldingen FOR UPDATE TO authenticated
USING (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]))
WITH CHECK (public.has_any_role(ARRAY['beheer','auditor','tekenaar']::app_role[]));

CREATE INDEX idx_herafmeldingen_project ON public.herafmeldingen(project_id);

CREATE OR REPLACE FUNCTION public.auto_finish_project_on_finding_close()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ep2 text;
  v_doel project_status;
BEGIN
  IF NEW.status IN ('reactie_goedgekeurd', 'gesloten') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.project_id = NEW.project_id
        AND f.zichtbaar_voor_adviseur = true
        AND f.status NOT IN ('reactie_goedgekeurd', 'gesloten')
    ) AND EXISTS (
      SELECT 1 FROM public.findings f2
      WHERE f2.project_id = NEW.project_id
        AND f2.zichtbaar_voor_adviseur = true
    ) AND EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.adviseurs a ON a.id = p.adviseur_id
      WHERE p.id = NEW.project_id
        AND a.email IS NOT NULL
        AND a.email <> ''
    ) THEN
      SELECT lower(coalesce(p.ep2_beoordeling, '')) INTO v_ep2
      FROM public.projects p WHERE p.id = NEW.project_id;

      IF v_ep2 = 'kt' AND NOT EXISTS (
        SELECT 1 FROM public.herafmeldingen h
        WHERE h.project_id = NEW.project_id AND h.status = 'goedgekeurd'
      ) THEN
        UPDATE public.projects
        SET status = 'wacht_op_herafmelding'
        WHERE id = NEW.project_id
          AND status = 'wacht_op_reactie';
      ELSE
        UPDATE public.projects
        SET status = 'afgerond',
            gearchiveerd_op = COALESCE(gearchiveerd_op, now())
        WHERE id = NEW.project_id
          AND status = 'wacht_op_reactie';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_all_findings_closed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ep2 text;
BEGIN
  IF NEW.status IN ('gesloten', 'reactie_goedgekeurd') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.findings
      WHERE project_id = NEW.project_id AND status NOT IN ('gesloten', 'reactie_goedgekeurd')
    ) THEN
      SELECT lower(coalesce(p.ep2_beoordeling, '')) INTO v_ep2
      FROM public.projects p WHERE p.id = NEW.project_id;

      IF v_ep2 = 'kt' AND NOT EXISTS (
        SELECT 1 FROM public.herafmeldingen h
        WHERE h.project_id = NEW.project_id AND h.status = 'goedgekeurd'
      ) THEN
        UPDATE public.projects SET status = 'wacht_op_herafmelding'
        WHERE id = NEW.project_id AND status <> 'gesloten';
      ELSE
        UPDATE public.projects SET status = 'gesloten' WHERE id = NEW.project_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;