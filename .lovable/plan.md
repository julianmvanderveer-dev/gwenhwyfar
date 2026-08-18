# EP2 start- en eindwaarde aanpasbaar na beoordeling reacties

## Doel
De auditor kan, ook nadat de reacties van de EP-adviseur zijn beoordeeld (project in fase "wacht op reactie", "afgerond" of "gesloten"), de EP2 start- en eindwaarde nog corrigeren. Nu zijn die velden na deel 2 vergrendeld; alleen de beoordeling (GOED/NKT/KT) was nog aanpasbaar.

## Werking
- Op het EP2-tabblad blijven de velden "Startwaarde EP2" en "Eindwaarde EP2" bewerkbaar voor de auditor (niet voor de EP-adviseur van hetzelfde project) zolang de audit in een afgeronde/wachtende fase staat.
- Bij het wijzigen van een waarde in die fase verschijnt hetzelfde bevestigingsvenster als bij een statuswijziging, met een tekstveld voor toelichting. De toelichting is **optioneel**: opslaan kan ook zonder tekst.
- De wijziging wordt vastgelegd in de bestaande wijzigingsgeschiedenis onderaan het EP2-tabblad, met oude waarde, nieuwe waarde, wie en wanneer, en de eventuele toelichting.
- Tijdens deel 1/deel 2 verandert er niets: waarden worden zoals nu direct opgeslagen zonder dialoog.
- De automatische EP2-beoordeling blijft geblokkeerd op afgeronde projecten, zodat een handmatige correctie niet wordt overschreven.

## Technisch
- `src/pages/ProjectDetail.tsx`
  - `disabled` op de start-/eindwaarde-inputs uitbreiden met `canEditEp2Post` (auditor, geen EP-adviseur van het project, fase afgerond/gesloten/wacht_op_reactie).
  - Nieuwe bevestigingsdialoog voor waardewijzigingen (hergebruik van de bestaande AlertDialog-opzet), met veld dat leeg mag blijven; annuleren zet het inputveld terug op de opgeslagen waarde.
  - Bij bevestigen: `projects.ep2_startwaarde` / `ep2_eindwaarde` bijwerken en een regel schrijven in `ep2_status_history`.
- Vastlegging gebruikt de bestaande tabel `ep2_status_history`; de kolommen `oude_status`/`nieuwe_status` krijgen een leesbare omschrijving zoals `startwaarde 125,50` -> `130,00`, en `reden` valt terug op "Geen toelichting opgegeven" wanneer leeg (kolom is verplicht). Geen databasewijziging nodig.
- Het bestaande overzicht van de wijzigingsgeschiedenis en het auditrapport tonen deze regels automatisch mee.
