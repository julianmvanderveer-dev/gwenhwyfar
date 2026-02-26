export interface ChecklistItem {
  onderdeel: string;
  controlepunt: string;
  code: string; // e.g. "1a"
  deel: 1 | 2;
}

export const EPW_D_CHECKLIST: ChecklistItem[] = [
  // 1. Dossier (d) — allemaal deel 1
  { onderdeel: "1. Dossier", code: "1a", controlepunt: "Dossier overzichtelijk opgebouwd?", deel: 1 },
  { onderdeel: "1. Dossier", code: "1b", controlepunt: "Tekeningen & bestanden aanwezig in dossier", deel: 1 },
  { onderdeel: "1. Dossier", code: "1c", controlepunt: "Voldoende foto's aanwezig in dossier", deel: 1 },
  { onderdeel: "1. Dossier", code: "1d", controlepunt: "9500/W aanwezig", deel: 1 },
  { onderdeel: "1. Dossier", code: "1e", controlepunt: "Formulier G/H of BENG-certificaat in het dossier?", deel: 1 },
  { onderdeel: "1. Dossier", code: "1f", controlepunt: "BENG-uitvoeringsplan aanwezig", deel: 1 },

  // 2. Bouwkundige uitgangspunten (b) — a-b deel 1, c-g deel 2
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2a", controlepunt: "Berekening op de juiste versie van de software", deel: 1 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2b", controlepunt: "Rc waarde gevel | vloer | dak", deel: 1 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2c", controlepunt: "Berekening volgens NTA8800 aanwezig (niet verplicht)", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2d", controlepunt: "U waarde kozijn | deur | paneel", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2e", controlepunt: "Onderbouwing U waarde in dossier", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2f", controlepunt: "Lineaire koudebruggen gecorrigeerd", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2g", controlepunt: "Niet forfaitaire koudebruggen: onderbouwing in dossier", deel: 2 },

  // 3. Algemene kenmerken (a) — allemaal deel 2
  { onderdeel: "3. Algemene kenmerken", code: "3a", controlepunt: "Klopt bouwjaar", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3b", controlepunt: "Is de thermische zone juist bepaald? (AOR, garage etc)", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3c", controlepunt: "Klopt de gebruiksoppervlakte GO", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3d", controlepunt: "Is de oriëntatie vastgelegd op tekening/situatieschets", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3e", controlepunt: "Juiste woningtype geselecteerd", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3f", controlepunt: "Gebouwmassa correct", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3g", controlepunt: "Verdeling in rekenzones correct", deel: 2 },

  // 4. Check geometrie (g) — allemaal deel 2
  { onderdeel: "4. Check geometrie", code: "4a", controlepunt: "Bij constructies ook juiste type geselecteerd", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4b", controlepunt: "Binnenklimaat juist", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4c", controlepunt: "Bij infiltratie minimaal 1 luchtdoorvoer of onbekend is ok", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4d", controlepunt: "Oppervlakte vloer correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4e", controlepunt: "Perimeter correct ingevoerd (bij vloeren)", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4f", controlepunt: "Kruipruimtevloerisolatie juist ingevuld (0p)", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4g", controlepunt: "Oppervlakte gevel correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4h", controlepunt: "Oppervlakte dak correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4i", controlepunt: "Hellingshoek dak(en) correct ingevoerd", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4j", controlepunt: "Deur met enkel kader ingevoerd als raam", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4k", controlepunt: "Oppervlakte ramen correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4l", controlepunt: "Oppervlakte panelen correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4m", controlepunt: "Zonwering correct ingevoerd", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4n", controlepunt: "(ZS) belemmeringen meegenomen", deel: 2 },

  // 5. Check installaties (i) — allemaal deel 2
  { onderdeel: "5. Check installaties", code: "5a", controlepunt: "Positie opwekker + tappunten aangegeven in tekening", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5b", controlepunt: "Leidinglengte naar tappunten correct berekend", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5c", controlepunt: "Oriëntatie zonnepanelen correct in berekening", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5d", controlepunt: "Overige specificaties zonnepanelen", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5e", controlepunt: "(ZI) belemmering zonnepanelen correct (<15 graden = ZUID)", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5f", controlepunt: "Verwarmingssysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5g", controlepunt: "Ventilatiesysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5h", controlepunt: "Koelsysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5i", controlepunt: "Warm tapwatersysteem correct ingevoerd", deel: 2 },
];
