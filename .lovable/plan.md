

# Checklist sortering fixen

## Probleem
Findings worden opgehaald met `order("created_at")` (regel 49 in `ProjectDetail.tsx`). Wanneer een finding wordt bijgewerkt, verandert de volgorde niet direct, maar na `loadFindings()` kan de volgorde afwijken van de logische checklist-volgorde (1a, 1b, 2a, etc.).

## Oplossing
In `src/pages/ProjectDetail.tsx` de findings na ophalen sorteren op `onderdeel` en dan op `controlepunt` code (numeriek-alfanumerisch), zodat ze altijd in de juiste checklist-volgorde staan.

Concreet:
- Regel 49-50: na het ophalen van findings, sorteren op het `onderdeel` veld (numeriek op het nummer-prefix) en daarbinnen op een natuurlijke vergelijking van het `controlepunt` veld, vergelijkbaar met hoe `ChecklistBeheer.tsx` al sorteert met `localeCompare(..., { numeric: true })`.

De sortering wordt client-side gedaan op het `onderdeel` veld (bijv. "1. Dossier" < "2. Bouwkundige uitgangspunten") en daarbinnen op `controlepunt`. Omdat `onderdeel` al een nummering bevat, werkt `localeCompare` met `numeric: true` correct.

### Bestand
- `src/pages/ProjectDetail.tsx` — sorteerlogica aanpassen in `loadFindings`

