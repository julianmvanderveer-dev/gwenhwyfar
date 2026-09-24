# Invoer blijft staan bij terugkijken in audit-tabbladen (melding Frank Nijsse)

## Stand van zaken

Frank meldde dit op 3-7-2026. Het grootste deel is inmiddels opgelost: sinds de aanpassing van 23-9 worden toelichtingen tijdens het typen vanzelf opgeslagen en onthouden bij het wisselen van tabblad.

Wat nog kan misgaan: bij het kiezen van een beoordeling (Goed / Niet goed / Opmerking / N.V.T.) of het type afwijking (kritiek / niet kritiek) wordt niet gecontroleerd of het opslaan gelukt is. Mislukt het (bijv. door een haperende verbinding), dan ziet de auditor geen melding en is de keuze na terugkeer weg.

## Wat we gaan doen

1. Beoordeling en type afwijking: bij mislukt opslaan een duidelijke melding tonen ("Niet opgeslagen, probeer opnieuw"), in plaats van stil te falen.
2. Direct na het kiezen de keuze in het scherm tonen, zodat je bij snel doorklikken naar een ander tabblad niet de oude waarde terugziet.
3. Het scenario van Frank naspelen: invoer doen, direct wisselen van tabblad, terugkeren — en controleren dat alles blijft staan.
4. Frank laten weten dat het is opgelost (via de feedbacklijst).

## Technische details

- `src/pages/ProjectDetail.tsx`: in `updateBeoordeling`, `handleBeoordeling` (wissen) en `updateAfwijkingType` de `error` van de update controleren en toasten; optimistische `setFindings(prev => ...)` vóór de database-aanroep, terugdraaien bij fout; `loadFindings()` blijft als bevestiging.
- Geen databasewijzigingen.
