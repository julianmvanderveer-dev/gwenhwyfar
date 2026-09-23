# Tab "Beheer" hernoemen naar "Instellingen"

## Doel
Binnen de rol **Beheer** staat in de donkerblauwe balk een navigatielink die óók "Beheer" heet — dat is verwarrend (rolnaam == tabnaam). De tab wordt hernoemd naar **"Instellingen"**.

## Wijziging
1. `src/components/AppLayout.tsx` (regel 105): het zichtbare label van de link naar `/beheer` verandert van `Beheer` → `Instellingen`.
   - De URL (`/beheer`) en route blijven ongewijzigd, zodat bestaande links en bookmarks blijven werken.
2. Paginakop in `src/pages/Beheer.tsx` (regel 493) eveneens van `Beheer` → `Instellingen` voor consistentie. De ondertitel "Team- en adviseurbeheer" blijft staan omdat die de inhoud goed beschrijft.

## Geen wijziging
- De rolschakelaar in de balk blijft "Beheer" tonen (dat is de rolnaam, geen tab).
- De route `/beheer`, de menu-items "Checklists", "Projecten" en "Overzicht", en alle backend/RLS-logica blijven ongewijzigd.

## Technische details
- Eén tekstwijziging in AppLayout.tsx, één in Beheer.tsx. Geen schema- of backendimpact.
