

## Plan: Checklistbevoegdheden per medewerker

### Wat
Een nieuw systeem waarmee beheerders per tekenaar/auditor kunnen instellen welke audit-categorieën (EPW-B, EPW-D, EPU-B, EPU-D, MWA-B, MWA-U) zij mogen behandelen. Dit varieert per persoon — bijv. Stefan alleen EPW-B/EPW-D, Hilbert alles.

### Wijzigingen

#### 1. Database: nieuwe tabel `user_audit_categorieën`
- Koppeltabel: `user_id` (uuid, FK profiles) + `audit_categorie` (audit_categorie enum)
- Unieke constraint op (user_id, audit_categorie)
- RLS: beheerders full access, gebruikers mogen eigen rijen lezen
- Geen rijen = geen bevoegdheden (expliciet toewijzen)

#### 2. `src/pages/Beheer.tsx` — Projectteam-tab uitbreiden
- Extra kolommen in de teamtabel: één checkbox per audit-categorie (EPW-B, EPW-D, EPU-B, EPU-D, MWA-B, MWA-U)
- Alleen zichtbaar/klikbaar voor gebruikers met rol tekenaar of auditor
- Toggle schrijft direct naar `user_audit_categorieën`
- Ook bij "Medewerker toevoegen" de categorieën selecteerbaar maken

#### 3. `src/pages/ProjectAanmaken.tsx` — Toewijzing filteren
- Bij specifieke toewijzing: filter `toewijsbarePersonen` niet alleen op rol (tekenaar), maar ook op of zij de gekozen `auditCategorie` in hun bevoegdheden hebben

#### 4. `src/pages/Inbox.tsx` + `src/components/projecten/FaseTabel.tsx` — Hertoewijzing filteren
- Bij inline hertoewijzing: filter beschikbare personen ook op audit-categorie van het project

#### 5. `src/pages/Beheer.tsx` — Toewijzingen-tab filteren
- Hertoewijzing-dropdown ook filteren op audit-categoriebevoegdheid

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Nieuwe tabel `user_audit_categorieën` met RLS |
| `src/pages/Beheer.tsx` | Checkboxkolommen per categorie in teamtabel + laden/opslaan bevoegdheden |
| `src/pages/ProjectAanmaken.tsx` | Filter toewijsbare personen op audit-categorie |
| `src/pages/Inbox.tsx` | Audit-categorie meeladen bij toewijsbare personen |
| `src/components/projecten/FaseTabel.tsx` | Filter hertoewijzing op audit-categorie van project |

