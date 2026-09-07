# Twee correcties: EP2 verplicht bij afronden + project blijft in de pool

## 1. Audit pas afronden als EP2 compleet is

Nu kan een auditor de audit afronden zonder dat het EP2-tabblad is ingevuld. Dat wordt geblokkeerd.

Bij het afronden wordt gecontroleerd of alle drie de velden gevuld zijn:
- EP2 startwaarde
- EP2 eindwaarde
- EP2 beoordeling (GOED / NKT / KT)

Ontbreekt er iets, dan verschijnt een duidelijke melding welke velden nog leeg zijn en gaat het afronden niet door.

Daarnaast:
- De knop "Audit afronden" is uitgeschakeld zolang EP2 niet compleet is, met een hint eronder ("Vul eerst het tabblad EP2 Beoordeling in").
- Dezelfde controle geldt op het moment dat de auditor de laatste reactiebeoordelingen verstuurt en het project daarmee definitief wordt afgesloten.

## 2. Project blijft in de pool na afronden deel 1

Wat er nu gebeurt: bij "Deel 1 afronden" wordt het project correct vrijgegeven naar de pool. Maar zodra de pagina daarna weer geladen wordt, claimt het systeem het project automatisch voor iedereen die de auditor-rol heeft — ook voor de tekenaar die zelf net deel 1 afrondde en óók auditor is. Het project springt dan meteen naar "Deel 2 bezig" op zijn naam. In de gegevens is dit vandaag zichtbaar bij project 6417VG2.

Aanpassing:
- Alleen bekijken van een project in de pool leidt niet meer tot automatisch claimen. Er verschijnt in plaats daarvan een duidelijke knop "Dit project oppakken" bovenaan; pas bij die klik wordt het project toegewezen.
- Direct na "Deel 1 afronden" gaat de gebruiker terug naar het overzicht, zodat het project zichtbaar in de pool blijft staan.
- Zolang het project niet is opgepakt, zijn de deel 2-acties niet bewerkbaar (alleen inzien).

## Technische details

- `src/pages/ProjectDetail.tsx`
  - Nieuwe afleiding `ep2Compleet` (start, eind en beoordeling gevuld); gebruikt in `auditAfronden` (blokkeren + toast) en op de afrondknop (`disabled` + hint).
  - `autoSetStatus`: de auto-claim via `claim_project` in de takken `deel1_afgerond`, `wacht_op_reactie` en `deel2_bezig` vervalt; alleen de statusovergang blijft voor reeds toegewezen projecten. Nieuwe handmatige actie `projectOppakken()` die `claim_project` aanroept en daarna de status zet.
  - `deel1Afronden`: na de update navigeren naar het overzicht.
- `src/hooks/useBatchVersturen.ts`: bij de definitieve afronding ook `ep2_startwaarde`, `ep2_eindwaarde` en `ep2_beoordeling` uit `projMeta` controleren en bij ontbreken blokkeren met melding.
- Geen databasewijzigingen nodig; `claim_project` blijft ongewijzigd.
