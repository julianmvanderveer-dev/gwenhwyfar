
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_categorie audit_categorie NOT NULL,
  code text NOT NULL,
  onderdeel text NOT NULL,
  controlepunt text NOT NULL,
  deel smallint NOT NULL DEFAULT 1,
  UNIQUE (audit_categorie, code)
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checklist templates select"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (has_any_role(ARRAY['beheer','tekenaar','auditor','ep_adviseur']::app_role[]));

CREATE POLICY "Checklist templates manage"
  ON public.checklist_templates FOR ALL
  TO authenticated
  USING (has_role('beheer'::app_role))
  WITH CHECK (has_role('beheer'::app_role));

-- Seed EPW-D
INSERT INTO public.checklist_templates (audit_categorie, code, onderdeel, controlepunt, deel) VALUES
('EPW-D','1a','1. Dossier','Dossier overzichtelijk opgebouwd?',1),
('EPW-D','1b','1. Dossier','Tekeningen & bestanden aanwezig in dossier',1),
('EPW-D','1c','1. Dossier','Voldoende foto''s aanwezig in dossier',1),
('EPW-D','1d','1. Dossier','Opdrachtbevestiging aanwezig met daarin voorwaarden BRL 9500-W_15-04-2024 aanwezig',1),
('EPW-D','1e','1. Dossier','Formulier G/H (of BengCert-variant) in het dossier?',1),
('EPW-D','1f','1. Dossier','BENG-uitgangspunten volledig in dossier',1),
('EPW-D','2a','2. Bouwkundige uitgangspunten','Berekening op de juiste versie van de software',1),
('EPW-D','2b','2. Bouwkundige uitgangspunten','Rc-waarde gevel | vloer | dak',1),
('EPW-D','2c','2. Bouwkundige uitgangspunten','Berekening volgens NTA8800 aanwezig (niet verplicht)',2),
('EPW-D','2d','2. Bouwkundige uitgangspunten','U-waarde kozijn | deur | paneel',2),
('EPW-D','2e','2. Bouwkundige uitgangspunten','Onderbouwing U-waarde in dossier',2),
('EPW-D','2f','2. Bouwkundige uitgangspunten','Lineaire koudebruggen gecorrigeerd',2),
('EPW-D','2g','2. Bouwkundige uitgangspunten','Niet forfaitaire koudebruggen: onderbouwing in dossier',2),
('EPW-D','3a','3. Algemene kenmerken','Klopt bouwjaar',2),
('EPW-D','3b','3. Algemene kenmerken','Is de thermische zone juist bepaald? (AOR, garage etc)',2),
('EPW-D','3c','3. Algemene kenmerken','Klopt de Gebruiksoppervlak GO',2),
('EPW-D','3d','3. Algemene kenmerken','Is de oriëntatie vastgelegd op tekening/situatieschets',2),
('EPW-D','3e','3. Algemene kenmerken','Juiste woningtype geselecteerd',2),
('EPW-D','3f','3. Algemene kenmerken','Gebouwmassa correct',2),
('EPW-D','3g','3. Algemene kenmerken','Verdeling in rekenzones correct',2),
('EPW-D','4a','4. Check geometrie','Bij constructies ook juiste type geselecteerd',2),
('EPW-D','4b','4. Check geometrie','Bij infiltratie: is gebouwhoogte correct ingevuld',2),
('EPW-D','4c','4. Check geometrie','Bij infiltratie minimaal 1 luchtdoorvoer of onbekend is ok',2),
('EPW-D','4d','4. Check geometrie','Oppervlakte vloer correct berekend',2),
('EPW-D','4e','4. Check geometrie','Perimeter correct ingevoerd (bij vloeren)',2),
('EPW-D','4f','4. Check geometrie','Kruipruimtevloerisolatie juist ingevuld (= 0,0)',2),
('EPW-D','4g','4. Check geometrie','Oppervlakte gevel correct berekend',2),
('EPW-D','4h','4. Check geometrie','Oppervlakte dak correct berekend',2),
('EPW-D','4i','4. Check geometrie','Hellingshoek dak(en) correct ingevoerd',2),
('EPW-D','4j','4. Check geometrie','Deur met enkel kader ingevoerd als raam',2),
('EPW-D','4k','4. Check geometrie','Oppervlakte deur(en) correct berekend',2),
('EPW-D','4l','4. Check geometrie','Oppervlakte ramen correct berekend',2),
('EPW-D','4m','4. Check geometrie','Oppervlakte panelen correct berekend',2),
('EPW-D','4n','4. Check geometrie','(zij-) belemmeringen meegenomen',2),
('EPW-D','5a','5. Check installaties','Positie opwekker + tappunten aangegeven in tekening',2),
('EPW-D','5b','5. Check installaties','Leidinglengte naar tappunten correct berekend',2),
('EPW-D','5c','5. Check installaties','Oriëntatie zonnepanelen correct in berekening',2),
('EPW-D','5d','5. Check installaties','Overige specificaties zonnepanelen',2),
('EPW-D','5e','5. Check installaties','(zij-)belemmering zonnepanelen correct (<15 grad.=ZUID)',2),
('EPW-D','5f','5. Check installaties','Verwarmingssysteem correct ingevoerd',2),
('EPW-D','5g','5. Check installaties','Tapwatersysteem correct ingevoerd',2),
('EPW-D','5h','5. Check installaties','Koelsysteem correct ingevoerd',2),
('EPW-D','5i','5. Check installaties','Ventilatiesysteem correct ingevoerd',2),
-- Seed EPW-B
('EPW-B','1a','1. Dossier','Dossier overzichtelijk opgebouwd?',1),
('EPW-B','1b','1. Dossier','Tekeningen & bestanden aanwezig in dossier',1),
('EPW-B','1c','1. Dossier','Voldoende foto''s aanwezig in dossier',1),
('EPW-B','1d','1. Dossier','Opdrachtbevestiging aanwezig met daarin voorwaarden BRL 9500-W_15-04-2024 aanwezig',1),
('EPW-B','1e','1. Dossier','Formulier G/H (of BengCert-variant) in het dossier?',1),
('EPW-B','1f','1. Dossier','BENG-uitgangspunten volledig in dossier',1),
('EPW-B','2b','2. Bouwkundige uitgangspunten','Rc-waarde gevel | vloer | dak',2),
('EPW-B','2d','2. Bouwkundige uitgangspunten','U-waarde kozijn | deur | paneel',2),
('EPW-B','2e','2. Bouwkundige uitgangspunten','Onderbouwing U-waarde in dossier',2),
('EPW-B','3a','3. Algemene kenmerken','Klopt bouwjaar',2),
('EPW-B','3b','3. Algemene kenmerken','Is de thermische zone juist bepaald? (AOR, garage etc)',2),
('EPW-B','3c','3. Algemene kenmerken','Klopt de Gebruiksoppervlak GO',2),
('EPW-B','3d','3. Algemene kenmerken','Is de oriëntatie vastgelegd op tekening/situatieschets',2),
('EPW-B','3e','3. Algemene kenmerken','Juiste woningtype geselecteerd',2),
('EPW-B','3f','3. Algemene kenmerken','Gebouwmassa correct',2),
('EPW-B','3g','3. Algemene kenmerken','Verdeling in rekenzones correct',2),
('EPW-B','4a','4. Check geometrie','Bij constructies ook juiste type geselecteerd',2),
('EPW-B','4b','4. Check geometrie','Bij infiltratie: is gebouwhoogte correct ingevuld',2),
('EPW-B','4c','4. Check geometrie','Bij infiltratie: minimaal 1 luchtdoorvoer of onbekend is ok',2),
('EPW-B','4d','4. Check geometrie','Oppervlakte vloer correct berekend',2),
('EPW-B','4e','4. Check geometrie','Perimeter correct ingevoerd (bij vloeren)',2),
('EPW-B','4f','4. Check geometrie','Kruipruimtevloerisolatie juist ingevuld (= 0,0)',2),
('EPW-B','4g','4. Check geometrie','Oppervlakte gevel correct berekend',2),
('EPW-B','4h','4. Check geometrie','Oppervlakte dak correct berekend',2),
('EPW-B','4i','4. Check geometrie','Hellingshoek dak(en) correct ingevoerd',2),
('EPW-B','4j','4. Check geometrie','Deur met enkel kader ingevoerd als raam',2),
('EPW-B','4k','4. Check geometrie','Oppervlakte deur(en) correct berekend',2),
('EPW-B','4l','4. Check geometrie','Oppervlakte ramen correct berekend',2),
('EPW-B','4m','4. Check geometrie','Oppervlakte panelen correct berekend',2),
('EPW-B','4n','4. Check geometrie','(zij-) belemmeringen meegenomen',2),
('EPW-B','5a','5. Check installaties','Positie opwekker + tappunten aangegeven in tekening',2),
('EPW-B','5b','5. Check installaties','Leidinglengte naar tappunten correct berekend',2),
('EPW-B','5c','5. Check installaties','Oriëntatie zonnepanelen correct in berekening',2),
('EPW-B','5d','5. Check installaties','Overige specificaties zonnepanelen',2),
('EPW-B','5e','5. Check installaties','(zij-)belemmering zonnepanelen correct (<15 grad.=ZUID)',2),
('EPW-B','5f','5. Check installaties','Verwarmingssysteem correct ingevoerd',2),
('EPW-B','5g','5. Check installaties','Tapwatersysteem correct ingevoerd',2),
('EPW-B','5h','5. Check installaties','Koelsysteem correct ingevoerd',2),
('EPW-B','5i','5. Check installaties','Ventilatiesysteem correct ingevoerd',2);
