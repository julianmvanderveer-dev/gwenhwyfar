

# EPW-D Checklist automatisch invullen bij projectaanmaak

## Wat er verandert

Bij het aanmaken van een project (in eerste instantie voor EPW-D) worden automatisch alle controlepunten uit de checklist als findings aangemaakt. Elk genummerd onderdeel (1 t/m 5) wordt een apart tabblad. Controlepunten krijgen een `deel`-markering (1 of 2) zodat de juiste rol ze kan beoordelen.

## Database

**Nieuw veld op `findings`**: `deel` (smallint, default 1) — geeft aan of het controlepunt bij deel 1 (tekenaar) of deel 2 (ep_adviseur) hoort.

## Checklist data (EPW-D)

De volgende onderdelen en controlepunten worden automatisch aangemaakt:

| Tab | Onderdeel | # items | Deel |
|-----|-----------|---------|------|
| 1 | Dossier (d) | 6 (a-f) | alle deel 1 |
| 2 | Bouwkundige uitgangspunten (b) | 7 (a-g) | a-b deel 1, c-g deel 2 |
| 3 | Algemene kenmerken (a) | 7 (a-g) | alle deel 2 |
| 4 | Check geometrie (g) | 14 (a-n) | alle deel 2 |
| 5 | Check installaties (i) | 9 (a-i) | alle deel 2 |

## Code-aanpassingen

### `ProjectAanmaken.tsx`
Na succesvol aanmaken van het project: automatisch alle EPW-D controlepunten als findings inserten met het juiste `onderdeel`, `controlepunt` (incl. nummering zoals "1a"), en `deel`.

### `ProjectDetail.tsx`
- Handmatig toevoegen van findings verwijderen (checklist is vast)
- Tabbladen tonen per onderdeel (1-5)
- `canDeel1` beperkt beoordeling tot findings met `deel=1`
- `canDeel2` beperkt beoordeling tot findings met `deel=2`
- Visueel onderscheid deel 1/deel 2 items (kleur of label)

