

# Rollen hernoemen en samenvoegen

## Huidige rollen → Nieuwe rollen

| Huidig (DB enum) | Nieuw | Functie |
|---|---|---|
| `planner` | **verwijderd** | samengevoegd met beheer |
| `beheer` | `beheer` | aanmaken audits, beheer |
| `tekenaar` | `tekenaar` | controleren deel 1 |
| `ep_adviseur` | `auditor` | controleren deel 2 |
| `adviseur` | `ep_adviseur` | bekijkt resultaten, reageert, stuurt terug |

## Database migratie

1. Enum `app_role` aanpassen: `planner` en `adviseur` verwijderen, `auditor` toevoegen
   - Stap: tijdelijke kolom, data migreren, enum herdefinieren
   - `ep_adviseur` → `auditor`, `adviseur` → `ep_adviseur`, `planner` → `beheer`
2. Bestaande `user_roles` rijen updaten naar nieuwe waarden
3. RLS policies updaten die verwijzen naar oude rolnamen (`planner`, `adviseur`, `ep_adviseur`)
4. `eigenaar_beoordeling` enum op findings updaten (als die `ep_adviseur` bevat → `auditor`)

## Code-aanpassingen

Alle bestanden die rolnamen gebruiken:

- **`useAuth.tsx`**: type `AppRole` wordt automatisch bijgewerkt via types.ts
- **`Beheer.tsx`**: `ALL_ROLES` array → `["tekenaar", "auditor", "ep_adviseur", "beheer"]`
- **`AppLayout.tsx`**: `hasRole("planner")` → `hasRole("beheer")`
- **`ProjectAanmaken.tsx`**: `hasRole("planner")` → verwijderen (alleen `beheer` check)
- **`ProjectDetail.tsx`**: `hasRole("ep_adviseur")` → `hasRole("auditor")`, `eigenaar_beoordeling` waarde `ep_adviseur` → `auditor`
- **`Inbox.tsx`**: 
  - `hasRole("adviseur")` → `hasRole("ep_adviseur")`
  - `hasRole("ep_adviseur")` (voor deel 2 check) → `hasRole("auditor")`
  - `planner` branch verwijderen (beheer vangt dat op)
- **`FindingBeoordeling.tsx`**: eventuele rolchecks updaten

## Samenvatting

4 rollen: **beheer**, **tekenaar**, **auditor**, **ep_adviseur**. Planner verdwijnt. De EP-adviseur is de externe adviseur die resultaten bekijkt en reageert.

