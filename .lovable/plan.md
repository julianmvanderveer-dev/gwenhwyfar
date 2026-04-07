

# BengCert logo updaten naar officieel ontwerp

## Analyse van het geüploade logo

Het echte logo verschilt aanzienlijk van de huidige SVG:
- **Vinkje**: Eén groot vinkje bestaande uit drie overlappende diagonale balken — geel/goud (links), groen (midden), blauw/navy (rechts) — die samen een kleurrijk checkmark vormen
- **Tekst**: "bengcert" in één kleur (donker navy, ~#1B2A4A), niet gesplitst in twee kleuren
- **Layout**: Vinkje boven de tekst in het volledige logo, maar voor de navbar wordt het horizontaal naast elkaar geplaatst

## Wijzigingen

### 1. `src/components/BengCertLogo.tsx` herschrijven
- Vinkje opbouwen uit drie overlappende gevulde parallelogrammen/paden: geel (#F5C518 / #EDBA1B), groen (#4AAD2B / #50A829), blauw (#1B3B8A / #2B4FA3)
- De overlappende gebieden creëren de kleurovergangen (geel+groen = donkergroen, groen+blauw = donkerder blauw)
- Tekst "bengcert" in één kleur (navy voor dark variant, wit voor light variant)
- Compact horizontaal formaat voor navbar-gebruik (vinkje links, tekst rechts)

### 2. Geen wijzigingen in andere bestanden
AppLayout.tsx en Login.tsx gebruiken al `BengCertLogo` met de juiste variant-props.

## Bestand

| Bestand | Wijziging |
|---|---|
| `src/components/BengCertLogo.tsx` | Herschrijven — SVG aanpassen aan officieel logo |

