
-- 1. Nieuwe enums
CREATE TYPE public.audit_categorie AS ENUM ('EPW-B', 'EPW-D', 'EPU-B', 'EPU-D', 'MWA-B', 'MWA-U');
CREATE TYPE public.audit_soort AS ENUM ('dossieraudit', 'projectaudit');

-- 2. Adviseurs tabel
CREATE TABLE public.adviseurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nummer integer NOT NULL,
  naam text NOT NULL,
  email text,
  actief boolean NOT NULL DEFAULT true
);

ALTER TABLE public.adviseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen met rol mag adviseurs lezen"
ON public.adviseurs FOR SELECT TO authenticated
USING (has_any_role(ARRAY['planner'::app_role, 'tekenaar'::app_role, 'ep_adviseur'::app_role, 'adviseur'::app_role, 'beheer'::app_role]));

CREATE POLICY "Beheer mag adviseurs bewerken"
ON public.adviseurs FOR ALL TO authenticated
USING (has_role('beheer'::app_role))
WITH CHECK (has_role('beheer'::app_role));

-- 3. Adviseurs invoegen
INSERT INTO public.adviseurs (nummer, naam) VALUES
(1, 'Aarts'), (2, 'Aengenoordt'), (3, 'Beumer'), (4, 'Boontjes'),
(5, 'Bossink'), (6, 'Brouwer'), (7, 'Buitenhuis'), (8, 'Buys'),
(9, 'Dijkstra'), (10, 'Emmen'), (11, 'Fleer'), (12, 'Haverkort'),
(13, 'Hein'), (14, 'Hilderink'), (15, 'Hodes'), (16, 'Hulsman'),
(17, 'Jorritsma'), (18, 'Kets'), (19, 'Keuken'), (20, 'Klement'),
(21, 'Kloeze'), (22, 'Kroeze'), (23, 'Kuipers'), (24, 'Meijerman'),
(25, 'Meijerink'), (26, 'Meurs'), (27, 'Morren'), (28, 'Olde Weghuis'),
(29, 'Petter'), (30, 'Pot'), (31, 'Ramaker'), (32, 'Sinnige'),
(33, 'Sleurink'), (34, 'Tempel'), (35, 'Tuin'), (36, 'Van Agt'),
(37, 'Wennink');

-- 4. Projects aanpassen: eerst adviseur_id nullen, dan FK droppen
UPDATE public.projects SET adviseur_id = NULL;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_adviseur_id_fkey;

-- Drop oude kolom en enum
ALTER TABLE public.projects DROP COLUMN audit_type;
DROP TYPE IF EXISTS public.audit_type;

-- Nieuwe kolommen
ALTER TABLE public.projects ADD COLUMN audit_categorie audit_categorie NOT NULL DEFAULT 'EPW-B';
ALTER TABLE public.projects ADD COLUMN audit_soort audit_soort NOT NULL DEFAULT 'dossieraudit';
ALTER TABLE public.projects ADD COLUMN toelatingsaudit boolean NOT NULL DEFAULT false;

-- Nieuwe FK naar adviseurs
ALTER TABLE public.projects ADD CONSTRAINT projects_adviseur_id_fkey
  FOREIGN KEY (adviseur_id) REFERENCES public.adviseurs(id);
