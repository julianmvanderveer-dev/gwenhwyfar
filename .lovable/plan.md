## Doel
Beheer kan handmatig de status van een project wijzigen, zodat foute fases (bv. te vroeg op `wacht_op_reactie` of `afgerond`) kunnen worden teruggezet en het project opnieuw door de auditor bewerkt kan worden.

## Plan

### 1. UI: Statuswijziging in `src/pages/ProjectDetail.tsx` (header)
- Alleen zichtbaar voor gebruikers met rol `beheer`.
- Compact `Select`-element in de header (naast de huidige statusbadge) met alle bekende statussen:
  `nog_niet_begonnen`, `deel1_bezig`, `deel1_afgerond`, `deel2_bezig`, `wacht_op_reactie`, `afgerond`, `gesloten`.
- Bij wijziging:
  - Bevestigingsdialoog (AlertDialog) met huidige → nieuwe status.
  - `UPDATE projects SET status = <nieuw> WHERE id = ...`.
  - Bij wijziging vanaf `afgerond`/`gesloten` terug naar een actieve fase: `gearchiveerd_op = NULL` zetten.
  - Toast + `loadProject()`.
- Geen automatische wijziging aan toewijzing/findings — beheer doet bewust een correctie. Wel een hint-tekst onder de select: "Wijzig met beleid — dit verandert alleen de fase, niet de toewijzing of bevindingen."

### 2. Audit-spoor
- Eenvoudige in-app notificatie naar de huidige `toegewezen_aan` (indien aanwezig) en naar de beheerder zelf: "Status van project X gewijzigd van A naar B door beheer."
- Geen aparte audit-tabel — buiten scope.

### 3. Buiten scope
- Geen wijzigingen aan RLS (beheer heeft al schrijfrechten op `projects`).
- Geen wijziging aan findings-statussen.
- Geen wijziging aan `claim_project` of auto-claim-logica.

## Technisch
- Bestand: `src/pages/ProjectDetail.tsx`
  - Imports uitbreiden: `AlertDialog*` (al gebruikt elders), `Select*` (al geïmporteerd).
  - Nieuwe state: `nieuweStatus`, `bevestigOpen`.
  - Handler `wijzigStatus(nieuw)` met update + optioneel `gearchiveerd_op` reset + notificatie-insert.
  - Render-blok achter `hasRole("beheer")` in de header.
