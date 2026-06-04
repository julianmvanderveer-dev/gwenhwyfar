## Stap 3 + 4 — Foutentelling per tab + rood/groene tab

**Definitie van fout**: bevinding met `beoordeling = 'niet_goed'` op rijen van die tab. Realtime afgeleid uit reeds geladen `findings`-state — geen extra database-veld nodig.

**UI (`src/pages/ProjectDetail.tsx`, alleen `TabsTrigger`-rendering)**:
- Per onderdeel `o` de niet-goed-bevindingen tellen via `findings.filter(f => f.onderdeel === o && f.beoordeling === 'niet_goed')`.
- `TabsTrigger`-styling: standaard groen (semantic accent-token van het design system, BengCert-groen) als telling = 0, rood (destructive-token) als telling > 0.
- Naast het tab-label een klein telpilletje met het aantal. Bij 0 fouten geen telpil, alleen groene tab.
- Voor de EP2-tab geen kleur/telling (telt geen niet-goed-bevindingen).

**Zichtbaarheid**: voor alle rollen (auditor, tekenaar, beheer én EP-adviseur).

## Stap 5 — Split <1% / ≥1% per tab

**Datamodel**:
- Nieuw boolean-veld `findings.afwijking_kleiner_1pct` (default `false`, nullable=false). Alleen relevant als `beoordeling = 'niet_goed'`; voor andere beoordelingen blijft het op `false`.
- Migratie voegt de kolom toe. Bestaande niet-goed bevindingen krijgen `false` (worden dus geteld als ≥1%) zodat huidige weergave consistent blijft.

**UI in checklist-rij (`ProjectDetail.tsx`)**:
- Naast/onder de bestaande "Upload vereist"-checkbox een tweede checkbox **"Afwijking < 1%"**, alleen zichtbaar als `editableNow && beoordeling === 'niet_goed'`.
- `onCheckedChange` schrijft direct naar `findings.afwijking_kleiner_1pct` (zelfde auto-save patroon als `upload_vereist`), inclusief `logCorrectie` als de bevinding al verstuurd is.

**Telling per tab** (vervangt het simpele getal uit Stap 4):
- `klein = niet_goed-rijen met afwijking_kleiner_1pct = true` ("<1%").
- `groot = niet_goed-rijen met afwijking_kleiner_1pct = false` ("≥1%").
- Tab toont label + pil `klein / groot` (bv. `2 / 1`), met tooltip "Afwijkingen <1% / ≥1%".
- Tabkleur: rood zodra `klein + groot > 0`, anders groen. (De ">4 = andere categorie" uit de oorspronkelijke vraag is na verduidelijking niet meer van toepassing — alleen <1% vs ≥1%.)

## Stap 6 — Audittype "Omgevingsvergunning" op project

**Datamodel**:
- Nieuw veld `projects.is_omgevingsvergunning boolean NOT NULL DEFAULT false`. Gekozen als boolean (i.p.v. enum) omdat alleen "Omgevingsvergunning" als extra type genoemd is; later uit te breiden met meer types door enum-migratie.

**Project aanmaken (`src/pages/ProjectAanmaken.tsx`)**:
- Checkbox "Omgevingsvergunning" toevoegen in het bestaande formulier, naast/onder de bestaande velden (audit_categorie, audit_soort). Waarde meegestuurd bij insert.

**Beheer / bewerken**: indien er een edit-flow is voor projecten in beheer, daar dezelfde checkbox toevoegen. Anders alleen op aanmaken-pagina.

**Weergave**:
- In de projectheader op `ProjectDetail.tsx` naast de bestaande audit-omschrijving (bv. "EPW-D dossieraudit") een badge **"Omgevingsvergunning"** tonen als `is_omgevingsvergunning = true`. Gebruikt accent-kleur, geen rode markering.
- In de projecttitel op overzichtspagina's (`AdviseurSectie.tsx`, `FaseTabel.tsx`, dashboard) optioneel hetzelfde badge — alleen toevoegen waar projectnaam zichtbaar is, geen layout-overhaul.

## Technische details

- Sortering, auto-save, RLS, GRANTs en bestaande policies blijven ongewijzigd. Alle nieuwe kolommen vallen onder bestaande RLS-policies (geen extra policies nodig — beide tabellen hebben al volledige rolgebaseerde policies).
- Migratie 1: `ALTER TABLE public.findings ADD COLUMN afwijking_kleiner_1pct boolean NOT NULL DEFAULT false;`
- Migratie 2: `ALTER TABLE public.projects ADD COLUMN is_omgevingsvergunning boolean NOT NULL DEFAULT false;`
- Geen wijziging aan checklist-templates, EP2-logica, statusflow, exports, of e-mailtemplates.

## Volgorde van uitvoer

1. Migraties (findings + projects).
2. `ProjectDetail.tsx`: tab-telling, kleuren, "<1%"-checkbox, header-badge.
3. `ProjectAanmaken.tsx`: checkbox "Omgevingsvergunning".
4. Visuele check in preview voor één test-project per status.