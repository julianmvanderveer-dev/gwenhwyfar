## Doel

1. Bij elke nieuwe audit moet een EP-adviseur worden toegewezen (verplicht veld).
2. Een audit mag niet worden afgerond als de gekoppelde EP-adviseur geen e-mailadres heeft.

## Wijzigingen

### 1. EP-adviseur verplicht bij aanmaken — `src/pages/ProjectAanmaken.tsx`
- `<select>` voor adviseur krijgt `required` en de lege optie "— Geen —" wordt vervangen door een placeholder "— Selecteer adviseur —" met lege value (zodat HTML5-validatie blokkeert).
- Extra clientside check in `handleSubmit`: als `adviseurId` leeg is, toon toast "Een EP-adviseur is verplicht" en stop.
- Label "Adviseur" → "EP-adviseur *".

### 2. E-mailcheck bij afronden audit
Een audit wordt "afgerond" op twee plekken:

**a. Auditor sluit audit handmatig** — zoeken in `src/pages/ProjectDetail.tsx` / `BeheerStandVanZaken.tsx` / `notify-adviseur` flow naar het punt waar status → `afgerond` of waar `notify-adviseur` wordt aangeroepen met `type: 'audit_afgerond'`. Vóór die actie:
- Haal `projects.adviseur_id` → `adviseurs.email` op.
- Als leeg/`null`: blokkeer met toast "Deze audit kan niet worden afgerond: de EP-adviseur heeft geen e-mailadres. Vul eerst een e-mailadres in bij Beheer → Adviseurs."

**b. Automatische afronding via trigger** `auto_finish_project_on_finding_close` (zet status op `afgerond` als alle findings gesloten zijn). Deze trigger uitbreiden zodat hij alleen op `afgerond` zet wanneer de adviseur een e-mailadres heeft; anders status laten staan (bv. blijft `wacht_op_reactie`) zodat beheer eerst het e-mailadres kan aanvullen.

**c. Edge function `notify-adviseur`** geeft al 404 bij ontbrekend e-mailadres — laten staan als vangnet.

### 3. UI-signalering
In project-detail/beheer waar de "Audit afronden"-knop staat: knop disabled tonen met tooltip "EP-adviseur heeft geen e-mailadres" wanneer dat het geval is. (Eerst exacte locatie bevestigen tijdens implementatie.)

## Technisch

- Migratie nodig voor aanpassing van `auto_finish_project_on_finding_close` (functie vervangen via `CREATE OR REPLACE FUNCTION`, voegt JOIN op `adviseurs` toe en checkt `email IS NOT NULL AND email <> ''`).
- Geen schemawijzigingen aan `adviseurs` of `projects`.
- Bestaande projecten zonder adviseur blijven werken; de validatie geldt alleen bij nieuw aanmaken en bij afronden.

## Open vraag
Bestaande projecten zonder adviseur — moeten die geblokkeerd worden tot een adviseur is toegewezen, of alleen nieuwe? Voorstel: alleen valideren bij nieuw aanmaken en bij afronden (geen retroactieve blokkade verder).
