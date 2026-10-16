# Correcties in de afhandeling van "Niet goed"-bevindingen

## Wat er verandert

**1. Reactiehistorie per bevinding altijd te openen**
- Bij elke bevinding in de audittabbladen komt een knop "Historie". Die opent een tijdlijn met, per ronde (1, 2, ...) en met datum:
  - wat de EP-adviseur stuurde (tekst, bijlagen en foto's),
  - wat de auditor besloot (goedgekeurd / afwijking vervalt / niet akkoord, met toelichting).
- De tijdlijn is alleen-lezen en ook na afronding van de audit te openen, voor auditor, beheer en de EP-adviseur van het project.

**2. Status in de tabbladen klopt na beoordeling**
- Een vervallen bevinding toont "Goed" met een label "Vervallen"; een goedgekeurde toont "Niet goed – afgehandeld".
- De rondemarkering (1 / 2) blijft staan, zodat zichtbaar is waar het oorspronkelijk om ging.
- Oudere bevindingen die vervallen zijn maar nog als "Niet goed" in het systeem staan, worden eenmalig rechtgezet.

**3. Eén telling voor fouten en eindoordeel**
- Vervallen bevindingen tellen niet mee.
- Afwijkingen kleiner dan 1% tellen niet meer als fout. Dit is anders dan nu: nu leidt zo'n afwijking nog tot NKT. Daarna: 2 vervallen + 1 kleiner dan 1% = 0 fouten = **GOED**.
- KT blijft gelden bij meer dan 4 fouten of een te grote EP2-afwijking.
- Het overzicht, de EP2-beoordeling, "Alle beoordelingen versturen" en de PDF gebruiken dezelfde berekening.

**4. Testen**
- Ik doorloop de hele route met een testproject: Niet goed, reactie van de adviseur, de auditor laat 2 bevindingen vervallen en 1 heeft een afwijking kleiner dan 1%.
- Daarna controleer ik de status per tabblad, de teller (0), het eindoordeel (GOED), de PDF en of de historie te openen is.

## Technisch
- Nieuw `src/lib/ep2Telling.ts`: `telFouten(findings)` en `berekenEp2(start, eind, findings)`. Een bevinding telt als fout bij `beoordeling === "niet_goed"`, niet vervallen en `!afwijking_kleiner_1pct`. Dit gebruiken `ProjectDetail.tsx` (autoEp2, uitleg, regel ~1573), `useBatchVersturen.ts` en `generateAuditReport.ts`.
- Vervallen herkennen: na de wijziging `beoordeling = "goed"`. Bij oudere data: een bericht dat begint met "[Goedgekeurd] Afwijking vervallen" of "[Afwijking vervallen]". Die oudere bevindingen zet ik eenmalig om naar `goed`.
- Nieuw `FindingHistorie.tsx` (dialoog). Dit leest `messages` per bevinding met afzender en ondertekende bijlage-links. Een ronde loopt tot en met elk auditorbesluit. Er komt een knop in de bevindingrij van `ProjectDetail.tsx` en in de adviseursweergave.
- Badges in tabbladen: Vervallen / Afgehandeld op basis van status en beoordeling.
- De database-opbouw verandert niet. Alleen de eenmalige rechtzetting van de oudere bevindingen. Eerder opgeslagen EP2-oordelen van afgeronde audits pas ik niet automatisch aan. Ik lever wel een lijst van audits die hierdoor anders zouden uitvallen.
