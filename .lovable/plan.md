## Wat er aan de hand is

Op dit project (`W26.044 BENG_18x Zuidwesthoek_Cruquius_BAM bwnr 026`) is Julian zowel:

- **EP-adviseur** (via `adviseurs.user_id`), én
- **Toegewezen auditor** (`projects.toegewezen_aan` = Julian)

Julian heeft net als EP-adviseur zijn reactie verstuurd. De bevinding staat correct op `reactie_ontvangen`, maar het project blijft "geclaimd" door Julian. Door de functiescheiding die we kort geleden hebben ingebouwd, mag Julian zijn eigen reactie niet beoordelen — en omdat het project niet meer in de pool zit, ziet geen enkele andere auditor het. Het loopt dus dood.

## Plan

### 1. Directe fix voor dit project (data-aanpassing)
Zet `toegewezen_aan = null`, `toegewezen_op = null`, `toewijzing = 'pool'` op project `66068f45-…`. Daarna verschijnt het project weer in de auditor-pool en kan een andere auditor het oppakken om de reactie te beoordelen. Status (`wacht_op_reactie`) en de bevindingen blijven ongewijzigd.

### 2. Structurele fix: auto-release bij rolconflict
In `useBatchVersturen.verstuurAdviseur` (de actie "Alle reacties versturen" als EP-adviseur):

- Na het verzenden controleren of `projects.toegewezen_aan` gelijk is aan de huidige user (= de EP-adviseur zelf).
- Zo ja: het project automatisch terugzetten naar de pool (`toegewezen_aan = null`, `toegewezen_op = null`, `toewijzing = 'pool'`) zodat een andere auditor het in zijn pool ziet en kan claimen.
- Bij de notificatie naar de auditor: als er geen andere auditor is toegewezen, sturen we de bestaande pool-/auditor-notificatie zodat alle auditors weten dat er een project in de pool ligt met reactie. (We hergebruiken de bestaande `notify-auditor` aanroep zoals nu, geen nieuwe templates.)

### 3. Preventie bij claimen
In `claim_project` (Postgres-functie) een extra check: een gebruiker mag een project niet claimen als hij/zij EP-adviseur van dat project is. De functie geeft dan gewoon `false` terug, en de UI toont al een toast "Project is helaas al door iemand anders opgepakt" — die boodschap passen we aan naar iets als "Je kunt dit project niet oppakken: je bent zelf EP-adviseur van dit project."

### 4. Buiten scope
- Geen wijzigingen aan beoordelingsschermen, e-mailtemplates of audit-afronding.
- Geen migratie van bestaande projecten waar dit ook speelt; ik kan na implementatie wel een query draaien om te zien of er meer projecten in dezelfde situatie zitten en die desgewenst los ook vrijgeven.

## Technische details
- Datafix via insert-tool: `UPDATE public.projects SET toegewezen_aan = NULL, toegewezen_op = NULL, toewijzing = 'pool' WHERE id = '66068f45-f5a6-48a0-acb9-d4409737f9c0';`
- Codewijziging: `src/hooks/useBatchVersturen.ts` — extra `update` op `projects` direct na de bestaande `update` van findings binnen `verstuurAdviseur`.
- Migratie: aanpassing van `public.claim_project` met extra `AND NOT EXISTS (SELECT 1 FROM adviseurs WHERE id = projects.adviseur_id AND user_id = _user_id)`-clausule. UI-toast aanpassen in `ProjectDetail.tsx` rond regel 136–150.
