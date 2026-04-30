## Probleem

In de huidige batch-flow slaan 'Reactie goedkeuren' / 'Niet akkoord' alleen een **concept** op. De daadwerkelijke verzending kan op dit moment alleen via het projectoverzicht (`BatchVersturen`-paneel). Bij een project met maar 1 openstaande reactie (zoals 107B) voelt dat als een onnodige omweg en lijkt het alsof er niets gebeurt na het klikken.

## Oplossing

Hergebruik de bestaande batchlogica uit `BatchVersturen.tsx` op de individuele bevinding-pagina's, zodat de gebruiker direct vanaf de bevinding alle klaarstaande concepten van het hele project kan versturen — zónder de batch-architectuur te slopen.

## Wijzigingen

### 1. Logica extraheren
Refactor `src/components/projecten/BatchVersturen.tsx`: haal de twee verzend-functies (`verstuurAdviseur`, `verstuurAuditor`) en de tellogica (`wachtOpAdviseur`, `wachtOpAuditor`, `adviseurConcepten`, `auditorConcepten`) uit de component naar een nieuwe hook `src/hooks/useBatchVersturen.ts`. De hook accepteert `project` + `findings` + `onSent` en levert booleans (`klaar`, `busy`), tellers en de twee verzendfuncties.

`BatchVersturen.tsx` blijft bestaan en gebruikt de hook (geen visuele verandering op het projectoverzicht).

### 2. Compacte verzendknop op finding-pagina
Nieuwe component `src/components/projecten/BatchVersturenCompact.tsx`:
- Laadt zelf alle findings van het project (`select * from findings where project_id = X`).
- Gebruikt dezelfde `useBatchVersturen`-hook.
- Toont een dunne, opvallende balk onderaan / bovenaan de bevinding-pagina:
  - **EP-adviseur**: "X van Y reacties klaar in dit project" + knop **"Alle reacties versturen"** (disabled tot klaar).
  - **Auditor**: "X van Y beoordelingen klaar (A goedgekeurd, B niet akkoord)" + knop **"Alle beoordelingen versturen"** (disabled tot klaar).
- Na succes: roept `onSent` aan → navigeert terug naar het projectoverzicht.

### 3. Inhaken in de bevinding-pagina's
- `src/pages/FindingReactie.tsx`: rendert `<BatchVersturenCompact projectId={finding.project_id} />` direct ná de actieknoppen (alleen tonen als gebruiker EP-adviseur is en project nog open reacties heeft).
- `src/pages/FindingBeoordeling.tsx`: idem, alleen voor auditors/beheer wanneer `wachtOpAuditor.length > 0`.
- De huidige groene 'Concept opgeslagen — Naar projectoverzicht'-banner kan blijven staan (extra route-optie), maar wordt minder belangrijk.

### 4. Tekstuele verfijning
- Wanneer er maar 1 openstaande reactie is, past het label aan naar **"Reactie nu versturen"** / **"Beoordeling nu versturen"** — geen 'alle' nodig.

## Wat NIET verandert

- De batch-architectuur blijft intact: concepten, status-flow (`reactie_ontvangen` / `reactie_goedgekeurd`), notificaties en deadline-resets blijven werken zoals nu.
- Het paneel `BatchVersturen` op het projectoverzicht blijft beschikbaar.
- Geen databasewijzigingen nodig.

## Resultaat

Een auditor (of EP-adviseur) kan na het opslaan van het concept direct op dezelfde pagina op "Verzenden" klikken, zónder eerst naar het projectoverzicht te gaan. Bij projecten met meerdere bevindingen krijgt hij dezelfde voortgangsindicator en moet hij alsnog alle bevindingen afronden voor de knop actief wordt — de batch-regel blijft dus gerespecteerd.
