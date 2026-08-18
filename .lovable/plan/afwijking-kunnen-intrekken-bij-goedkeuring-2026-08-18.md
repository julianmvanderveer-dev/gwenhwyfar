# Afwijking kunnen intrekken bij goedkeuring

## Probleem
Als de EP-adviseur weerlegt ("dit is geen fout") en de auditor het daarmee eens is, kan hij alleen "Reactie goedkeuren" kiezen. De bevinding sluit dan wel, maar de beoordeling blijft "Niet goed" — de fout blijft dus staan in het overzicht, het auditrapport, de EP2-telling en de foutenanalyse.

## Oplossing
Een derde keuze voor de auditor: **Afwijking vervalt**. Daarmee wordt de bevinding ingetrokken: beoordeling gaat terug naar "Goed", de bevinding telt nergens meer mee als afwijking en wordt gesloten. De volledige berichtenhistorie (auditor stelde fout vast, adviseur weerlegde, auditor ging akkoord) blijft bewaard.

## Wat de auditor ziet
Op het beoordelingsscherm van een reactie staan straks drie knoppen:

- Reactie goedkeuren — afwijking was terecht en is afgehandeld (blijft "Niet goed")
- Afwijking vervalt — adviseur had gelijk, bevinding wordt ingetrokken (wordt "Goed")
- Niet akkoord — bevinding heropenen voor de adviseur

"Afwijking vervalt" vraagt om een korte (optionele) toelichting waarom de afwijking vervalt; die wordt als bericht in de historie gezet. Net als de andere keuzes wordt dit eerst als concept opgeslagen en meegenomen in "Alle beoordelingen versturen" vanaf het projectoverzicht. In de conceptbalk en de verzendknop wordt dit apart geteld ("x goedgekeurd, x vervallen, x heropend").

## Technisch
- `src/pages/FindingBeoordeling.tsx`: derde knop + tekstveld; slaat `concept_beoordeling` op met `type: "vervallen"` en optionele toelichting. Conceptweergave-labels uitbreiden.
- `src/hooks/useBatchVersturen.ts`: nieuwe tak in `verstuurAuditor` voor `type === "vervallen"` — findings updaten naar `beoordeling: "goed"`, `status: "reactie_goedgekeurd"`, `goedgekeurd_op` gezet, `zichtbaar_voor_adviseur: false`, `type_afwijking`/`deadline`/`upload_vereist` geleegd, `concept_beoordeling: null`; bericht `[Afwijking vervallen] ...` toevoegen. Nieuwe teller `vervallenCount` in de return.
- `src/components/projecten/BatchVersturen.tsx` en `BatchVersturenCompact.tsx`: telling en knoptekst tonen het aantal vervallen bevindingen.
- Bestaande afrondingslogica (auto "afgerond" wanneer alles gesloten is) blijft ongewijzigd werken, omdat vervallen bevindingen ook in een afgesloten status komen.
- Geen databasewijziging nodig: `concept_beoordeling` is een jsonb-veld en "goed" bestaat al als beoordeling.
