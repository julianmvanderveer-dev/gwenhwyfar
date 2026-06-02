## Doel
Workflow voor project aanmaken en oppakken gelijktrekken volgens 5 regels.

## Huidige situatie
- **Aanmaken**: beheer/tekenaar/auditor mogen al aanmaken ✅
- **Pool default**: beheer kan kiezen pool/specifiek, maar tekenaar/auditor worden nu *automatisch* aan zichzelf toegewezen (`ProjectAanmaken.tsx` regels 99–104). ❌
- **Deel 1 oppakken**: alleen `tekenaar` kan claimen (`ProjectDetail.tsx` `autoSetStatus` + `canDeel1`). Auditor niet. ❌
- **Deel 2 oppakken**: alleen `auditor` claimt vanuit pool ✅
- **Auto-toewijzen bij eerste werk**: gebeurt al via `claim_project` rpc bij betreden van pool-project ✅

## Wijzigingen

### 1. `src/pages/ProjectAanmaken.tsx`
- Verwijder de auto-self-assign voor tekenaar/auditor. Iedereen (ook tekenaar/auditor) maakt project standaard aan met `toewijzing = 'pool'`, `toegewezen_aan = null`.
- Beheer behoudt de keuze pool/specifiek (UI is al aanwezig).
- Tekenaar/auditor zien geen toewijzing-blok → gaat altijd naar pool.

### 2. `src/pages/ProjectDetail.tsx`
- **`canDeel1`**: ook `auditor` mag deel 1 oppakken
  → `(hasRole("tekenaar") || hasRole("auditor")) && status in (nog_niet_begonnen, deel1_bezig)`
- **`autoSetStatus`**: condities voor deel 1-claim verbreden naar tekenaar **of** auditor.
- **`mayCorrect`**: deel-1 correcties ook door auditor toestaan (`f.deel === 1 && (tekenaar || auditor)`) zodat een auditor die deel 1 oppakt ook normaal kan werken.
- Eigenaar-beoordeling label (regel 289/292/317): zet `eigenaar_beoordeling` op basis van wie het project op dat moment behandelt (huidige user), niet alleen "tekenaar vs auditor"-rol. Praktisch: gebruik `hasRole("tekenaar") ? "tekenaar" : "auditor"` blijft werkbaar, maar bij iemand met beide rollen → kies o.b.v. `project.status` (deel1 → tekenaar, deel2 → auditor).

### 3. Geen DB-migratie nodig
- `claim_project` rpc werkt al voor beide rollen (security definer, geen rol-check binnen functie).
- RLS op `projects` staat tekenaar én auditor al toe om pool-projecten te zien en te updaten.

## Out of scope
- Geen wijzigingen aan deel 2-flow (werkt al volgens spec).
- Geen wijzigingen aan beheer-toewijzing UI.
- Geen wijzigingen aan notificaties/edge functions.
