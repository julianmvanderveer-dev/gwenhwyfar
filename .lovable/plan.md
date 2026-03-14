

## Plan: "Mee bezig" → "Verder gaan" met opvallende knop

### Wijziging in `src/components/dashboard/MedewerkerDashboard.tsx`

In de `getStatusInfo` functie:

**Tekenaar** (regel 149):
- `deel1_bezig`: label wijzigen van `"Mee bezig"` naar `"Verder gaan"`, variant wijzigen van `"outline"` naar `"default"`

**Auditor** (regel 159):
- `deel2_bezig`: label wijzigen van `"Mee bezig"` naar `"Verder gaan"`, variant wijzigen van `"outline"` naar `"default"`

Dit maakt de knop visueel opvallender (gevulde primaire kleur in plaats van outline).

### Betrokken bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/components/dashboard/MedewerkerDashboard.tsx` | Label en variant aanpassen voor actieve projecten |

