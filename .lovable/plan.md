## Doel

Het auditrapport (`src/lib/generateAuditReport.ts`) op twee punten verbeteren:

1. De grote "Niet goed"-teller bovenaan toont nu álle ooit geconstateerde afwijkingen, ook als ze inmiddels afdoende zijn weerlegd. Dat geeft een verkeerd beeld ("3 fout" terwijl alles in orde is).
2. De opmaak oogt rommelig — te veel kleuren/blokken die om aandacht vechten, gridlay-out die in `window.print()` niet altijd betrouwbaar werkt, en dubbele informatie tussen "Openstaande afwijkingen" en de samenvatting.

## Wijzigingen in `src/lib/generateAuditReport.ts`

### 1. Samenvatting: onderscheid open vs. weerlegd

Tellingen uitsplitsen:

- **Goed**: `beoordeling === 'goed'` (ongewijzigd)
- **Open afwijking**: `beoordeling === 'niet_goed'` én status níet in `['reactie_goedgekeurd','gesloten']` (= dezelfde set als de "Openstaande afwijkingen"-tabel bovenaan)
- **Weerlegd**: `beoordeling === 'niet_goed'` én status in `['reactie_goedgekeurd','gesloten']`
- **Opmerking**: ongewijzigd

De grote rode teller wordt dus alleen rood/prominent als er écht open afwijkingen zijn. "Weerlegd" krijgt een neutrale grijs/groen-tint zodat duidelijk is dat dit afgehandeld is.

Wanneer `openAfwijkingen === 0`: het rode openstaande-blok valt sowieso al weg (bestaande logica) en de samenvatting laat een rustig overzicht zien zonder alarmerend rood.

### 2. Opmaak opschonen

- Vervang `display:grid` door `<table>`-layout in de project-info en samenvattingsblokken (betrouwbaarder bij `window.print()`).
- Eén consistent kleurenpalet: BengCert-blauw `#1B2A4A` voor koppen/headers, BengCert-groen `#7AB929` voor "goed", rood `#b91c1c` alleen voor échte open afwijkingen, neutraal grijs voor de rest.
- Strakkere ruimtebalans: uniforme `margin-bottom:20px` tussen secties, kleinere padding in samenvattingskaarten, dunnere randen (1px i.p.v. 2px) zodat het rapport rustiger oogt.
- Header: logo en titel in één regel met vaste hoogte; rapportdatum rechts uitgelijnd onder elkaar zonder grid.
- "Openstaande afwijkingen"-tabel: dezelfde kolomstijl/typografie als de bevindingen-tabellen verderop voor visuele consistentie.
- Samenvatting krijgt 4 kolommen (Goed / Open afwijking / Weerlegd / Opmerking) i.p.v. 3, in dezelfde kaartstijl.
- Verwijder het 📝-emoji bij toelichtingen; vervang door een nette grijze "Toelichting:"-prefix.

### 3. Geen functionele wijzigingen elders

Geen wijzigingen in `ProjectDetail.tsx` of de aanroep — alleen de interne renderlogica en HTML/CSS van de rapportgenerator.

## Resultaat

- Bij een project waar alle "niet goed"-bevindingen zijn weerlegd: bovenaan groene melding "Geen openstaande afwijkingen", samenvatting toont **0 open afwijking** en bv. **3 weerlegd** in een neutrale tint.
- Bij openstaande afwijkingen: rode teller toont alleen het werkelijk openstaande aantal, weerlegde staan apart.
- Algehele uitstraling rustiger en consistenter, beter geschikt voor PDF-print.
