

# Achtergrondkleur per rol in ontwikkelfase

## Aanpak

In `src/components/AppLayout.tsx` de achtergrondkleur van de wrapper `<div>` dynamisch instellen op basis van de hoogste prioriteitsrol van de ingelogde gebruiker:

| Rol | Achtergrondkleur |
|-----|-----------------|
| ep_adviseur | `bg-yellow-50` (lichtgeel) |
| auditor | `bg-blue-50` (lichtblauw) |
| tekenaar | `bg-green-50` (lichtgroen) |
| beheer | standaard (wit) |

Prioriteit: als iemand meerdere rollen heeft, wordt de eerste match gebruikt in volgorde: ep_adviseur → auditor → tekenaar → beheer.

De `min-h-screen` class wordt ook toegevoegd zodat de kleur het hele scherm vult.

### Bestand
- `src/components/AppLayout.tsx` — achtergrondkleur-logica toevoegen op de root `<div>`

