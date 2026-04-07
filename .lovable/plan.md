

# Tabs tonen voor gebruikers met meerdere rollen

## Probleem
De code bouwt `beschikbareWeergaven` correct op basis van `user_roles`, maar je ziet geen tabbladen. Er zijn twee mogelijke oorzaken:

1. **Timing**: De `roles` array is bij eerste render nog leeg of incompleet, waardoor `beschikbareWeergaven` maar 1 item heeft en geen tabs toont. Daarna wordt niet opnieuw gerenderd.
2. **EP-adviseur ontbreekt**: Je staat in de `adviseurs`-tabel maar hebt geen `ep_adviseur` rol in `user_roles`, dus die tab verschijnt sowieso niet.

## Oplossing

### 1. `src/pages/Inbox.tsx` — EP-adviseur tab ook tonen op basis van adviseurs-tabel
- Na het laden van adviseur-data, een extra state `isAdviseur` bijhouden
- In `beschikbareWeergaven`: EP-adviseur tab tonen als `hasRole("ep_adviseur") || isAdviseur`
- Dit voorkomt dat je handmatig rollen moet synchroniseren

### 2. `src/pages/Inbox.tsx` — Defensieve rendering
- `beschikbareWeergaven` laten afhangen van zowel `roles` als `isAdviseur`
- Een `console.log` toevoegen die de beschikbare weergaven logt bij elke berekening (tijdelijk, voor debugging)

### 3. Database — `ep_adviseur` rol toevoegen (optioneel)
- INSERT `ep_adviseur` in `user_roles` voor julian@borgch.nl zodat de rol ook formeel klopt

## Wijzigingen

| Bestand | Wijziging |
|---|---|
| `src/pages/Inbox.tsx` | `isAdviseur` state + EP-adviseur tab op basis van adviseurs-tabel |
| Database (optioneel) | `ep_adviseur` rol toevoegen aan user_roles |

