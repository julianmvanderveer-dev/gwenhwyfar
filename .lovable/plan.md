

## Wijzigingen in MedewerkerDashboard

Drie aanpassingen in `src/components/dashboard/MedewerkerDashboard.tsx`:

### 1. "Findings" hernoemen naar "Bevindingen"
- Tabblad-trigger tekst: "Findings" → "Bevindingen"
- Lege-staat tekst: "Er zijn momenteel geen openstaande findings." → "Er zijn momenteel geen openstaande bevindingen."

### 2. Projecten splitsen in twee groepen
Het tabblad "Mijn projecten" toont nu één lijst. Dit wordt gesplitst in twee secties met een duidelijke kop:

**"Aan mij toegewezen"** — projecten waar `toegewezen_aan === user.id`
**"Beschikbaar in pool"** — projecten waar `toewijzing === 'pool'` en `toegewezen_aan` is null

Elke sectie heeft een eigen subkop (h3) en tabel. Als een sectie leeg is, toon een korte melding ("Geen toegewezen projecten" / "Geen beschikbare projecten in de pool").

### 3. Zelfde indeling voor auditor
De auditor krijgt exact dezelfde twee-sectie-indeling. De bestaande rol-specifieke filtering en statuslabels blijven ongewijzigd.

### Betrokken bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/dashboard/MedewerkerDashboard.tsx` | Hernoem "Findings"→"Bevindingen", splits projectenlijst in twee groepen |

