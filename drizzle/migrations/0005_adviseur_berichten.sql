CREATE TABLE public.adviseur_berichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soort text NOT NULL DEFAULT 'algemeen',
  titel text NOT NULL,
  inhoud text NOT NULL DEFAULT '',
  evenement_datum timestamptz,
  evenement_locatie text,
  bijlage_pad text,
  bijlage_naam text,
  vastgepind boolean NOT NULL DEFAULT false,
  adviseur_id uuid REFERENCES public.adviseurs(id) ON DELETE CASCADE,
  actief boolean NOT NULL DEFAULT true,
  aangemaakt_door uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adviseur_berichten TO authenticated;
GRANT ALL ON public.adviseur_berichten TO service_role;
ALTER TABLE public.adviseur_berichten ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beheer beheert berichten" ON public.adviseur_berichten FOR ALL TO authenticated
  USING (public.has_role('beheer')) WITH CHECK (public.has_role('beheer'));
CREATE POLICY "Adviseur leest eigen berichten" ON public.adviseur_berichten FOR SELECT TO authenticated
  USING (actief AND (adviseur_id IS NULL OR adviseur_id IN (SELECT id FROM public.adviseurs WHERE user_id = auth.uid())));

CREATE TABLE public.adviseur_berichten_gelezen (
  bericht_id uuid NOT NULL REFERENCES public.adviseur_berichten(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  gelezen_op timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bericht_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.adviseur_berichten_gelezen TO authenticated;
GRANT ALL ON public.adviseur_berichten_gelezen TO service_role;
ALTER TABLE public.adviseur_berichten_gelezen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigen gelezen beheren" ON public.adviseur_berichten_gelezen FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Beheer ziet gelezen" ON public.adviseur_berichten_gelezen FOR SELECT TO authenticated
  USING (public.has_role('beheer'));