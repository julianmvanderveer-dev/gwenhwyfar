import type { ChecklistItem } from "./epwd-checklist";

export const EPU_B_CHECKLIST: ChecklistItem[] = [
  // 1. Dossier (d) — deel 1
  { onderdeel: "1. Dossier", code: "1a", controlepunt: "Dossier overzichtelijk opgebouwd?", deel: 1 },
  { onderdeel: "1. Dossier", code: "1b", controlepunt: "Tekeningen & bestanden aanwezig in dossier", deel: 1 },
  { onderdeel: "1. Dossier", code: "1c", controlepunt: "Voldoende foto's aanwezig in dossier", deel: 1 },
  { onderdeel: "1. Dossier", code: "1d", controlepunt: "Opdrachtbevestiging aanwezig met daarin voorwaarden BRL 9500-W_15-04-2024 aanwezig", deel: 1 },
  { onderdeel: "1. Dossier", code: "1e", controlepunt: "Formulier G/H (of BengCert-variant) in het dossier?", deel: 1 },
  { onderdeel: "1. Dossier", code: "1f", controlepunt: "BENG-uitgangspunten volledig in dossier", deel: 1 },

  // 2. Bouwkundige uitgangspunten (b) — deel 2
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2b", controlepunt: "Rc-waarde gevel | vloer | dak", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2d", controlepunt: "U-waarde kozijn | deur | paneel", deel: 2 },
  { onderdeel: "2. Bouwkundige uitgangspunten", code: "2e", controlepunt: "Onderbouwing U-waarde in dossier", deel: 2 },

  // 3. Algemene kenmerken (a) — deel 2
  { onderdeel: "3. Algemene kenmerken", code: "3a", controlepunt: "Klopt bouwjaar", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3b", controlepunt: "Is de thermische zone juist bepaald? (AOR, garage etc)", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3c", controlepunt: "Klopt de Gebruiksoppervlak GO", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3d", controlepunt: "Is de oriëntatie vastgelegd op tekening/situatieschets", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3e", controlepunt: "Juiste woningtype geselecteerd", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3f", controlepunt: "Gebouwmassa correct", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3g", controlepunt: "Verdeling in rekenzones correct", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3h", controlepunt: "Is er een duidelijke tekening met functie-indeling aanwezig?", deel: 2 },
  { onderdeel: "3. Algemene kenmerken", code: "3i", controlepunt: "Zijn de hulpfuncties juist toebedeeld aan gebruiksfuncties?", deel: 2 },

  // 4. Check geometrie (g) — deel 2
  { onderdeel: "4. Check geometrie", code: "4a", controlepunt: "Bij constructies ook juiste type geselecteerd", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4b", controlepunt: "Bij infiltratie: is gebouwhoogte correct ingevuld", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4c", controlepunt: "Bij infiltratie: minimaal 1 luchtdoorvoer of onbekend is ok", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4d", controlepunt: "Oppervlakte vloer correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4e", controlepunt: "Perimeter correct ingevoerd (bij vloeren)", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4f", controlepunt: "Kruipruimtevloerisolatie juist ingevuld (= 0,0)", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4g", controlepunt: "Oppervlakte gevel correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4h", controlepunt: "Oppervlakte dak correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4i", controlepunt: "Hellingshoek dak(en) correct ingevoerd", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4j", controlepunt: "Deur met enkel kader ingevoerd als raam", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4k", controlepunt: "Oppervlakte deur(en) correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4l", controlepunt: "Oppervlakte ramen correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4m", controlepunt: "Oppervlakte panelen correct berekend", deel: 2 },
  { onderdeel: "4. Check geometrie", code: "4n", controlepunt: "(zij-) belemmeringen meegenomen", deel: 2 },

  // 5. Check installaties (i) — deel 2
  { onderdeel: "5. Check installaties", code: "5a", controlepunt: "Positie opwekker + tappunten aangegeven in tekening", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5b", controlepunt: "Leidinglengte naar tappunten correct berekend", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5c", controlepunt: "Oriëntatie zonnepanelen correct in berekening", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5d", controlepunt: "Overige specificaties zonnepanelen", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5e", controlepunt: "(zij-)belemmering zonnepanelen correct (<15 grad.=ZUID)", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5f", controlepunt: "Verwarmingssysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5g", controlepunt: "Tapwatersysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5h", controlepunt: "Koelsysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5i", controlepunt: "Ventilatiesysteem correct ingevoerd", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5j", controlepunt: "Verlichting - correct vermogen?", deel: 2 },
  { onderdeel: "5. Check installaties", code: "5k", controlepunt: "Verlichting - correcte schakeling?", deel: 2 },
];
