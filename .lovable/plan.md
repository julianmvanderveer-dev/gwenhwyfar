

# Aanpassingen Project Aanmaken

## Samenvatting
Drie wijzigingen aan het projectformulier: audit type vervangen door specifieke categorieën, onderscheid dossier/projectaudit toevoegen, toelatingsaudit-vinkje toevoegen, en een vaste adviseurlijst uit het PDF-bestand gebruiken.

---

## Stap 1: Database migratie

**Nieuw enum `audit_categorie`**: `EPW-B`, `EPW-D`, `EPU-B`, `EPU-D`, `MWA-B`, `MWA-U`
(vervangt het huidige `audit_type` enum intern/extern)

**Nieuw enum `audit_soort`**: `dossieraudit`, `projectaudit`

**Nieuwe kolommen op `projects`**:
- `audit_categorie` (nieuw enum, vervangt `audit_type`)
- `audit_soort` (dossieraudit / projectaudit)
- `toelatingsaudit` (boolean, default false)

**Kolom verwijderen**: `audit_type` wordt vervangen door `audit_categorie`

**Nieuwe tabel `adviseurs`**:
| kolom | type |
|-------|------|
| id | uuid (PK) |
| nummer | integer |
| naam | text |
| email | text (nullable, later toe te voegen) |
| actief | boolean (default true) |

- RLS: iedereen met een rol mag lezen, alleen beheer mag bewerken
- `projects.adviseur_id` wordt een FK naar `adviseurs.id` in plaats van `profiles.id`

**Voorvullen adviseurs** met de 37 namen uit het PDF (met hun nummers).

## Stap 2: Frontend aanpassen (`ProjectAanmaken.tsx`)

- Dropdown `Audit type` → vervangen door dropdown `Audit categorie` met 6 opties
- Nieuwe dropdown `Audit soort`: dossieraudit / projectaudit
- Nieuw vinkje `Toelatingsaudit`
- Adviseur-dropdown: ophalen uit `adviseurs` tabel i.p.v. `profiles`, tonen als "Naam (Nummer)"

## Stap 3: ProjectDetail en Inbox aanpassen

- Verwijzingen naar `audit_type` vervangen door `audit_categorie`
- `audit_soort` en `toelatingsaudit` tonen waar relevant

---

## Technische details

De migratie zal:
1. Nieuw enum `audit_categorie` aanmaken
2. Nieuw enum `audit_soort` aanmaken
3. Kolom `audit_type` droppen en vervangen door `audit_categorie` + `audit_soort`
4. `toelatingsaudit` boolean toevoegen
5. Tabel `adviseurs` aanmaken met RLS
6. FK op `projects.adviseur_id` wijzigen van `profiles` naar `adviseurs`
7. Alle 37 adviseurs uit het PDF inserten

