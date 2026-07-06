## Doel
Auditor en tekenaar mogen — net als beheer — een volledig project verwijderen (met alle bevindingen, reacties en uitdraai).

## Wijzigingen

### 1. Database (RLS)
Migratie op `projects` DELETE-policy:
- Van: alleen `has_role('beheer')`
- Naar: `has_role('beheer') OR has_any_role(['tekenaar','auditor'])`

Cascade FK's op findings/messages/project_outputs/project_deel1 blijven ongewijzigd (regelen de opruiming).

### 2. Frontend
- **`src/pages/ProjectDetail.tsx`** — rode "Verwijderen"-knop nu ook tonen als de gebruiker `auditor` of `tekenaar` is (naast `beheer`).
- **`src/pages/Inbox.tsx`** — `canDelete={true}` op de drie `FaseTabel`s ook doorgeven wanneer de weergave voor auditor/tekenaar getoond wordt. Op dit moment staat de prullenbak enkel in de beheer-view; die knop moet ook zichtbaar zijn in het projectenoverzicht van de auditor/tekenaar (Medewerker-dashboard).
  - Check: het medewerker-overzicht loopt via `MedewerkerDashboard`. Als daar geen `FaseTabel` met delete zit, voegen we een equivalente delete-actie toe op de projectregels die auditor/tekenaar ziet.

### 3. Buiten scope
- Geen soft-delete of prullenbak.
- Geen wijziging aan wie een project mag UPDATE'en.
- EP-adviseur krijgt geen verwijderrecht.

## Bevestiging nodig
Klopt dat auditor én tekenaar dit recht krijgen zonder verdere restrictie (bijv. alleen eigen toegewezen projecten)? Of alleen projecten die aan hen zijn toegewezen?
