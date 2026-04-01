

## Plan: EP2-beoordeling automatisch berekenen (KT/NKT/GOED)

### Logica

De EP2-beoordeling wordt automatisch bepaald op basis van drie criteria:

1. **KT (Kritiek)** als een van deze waar is:
   - Eindwaarde > 125 EN afwijking > 8% t.o.v. startwaarde
   - Eindwaarde <= 125 EN absolute afwijking > 10 kWh/m²
   - Meer dan 4 findings met beoordeling "niet_goed"

2. **NKT (Niet Kritiek)** als er minstens 1 finding "niet_goed" is maar geen KT-criteria

3. **GOED** als alle findings "goed" zijn (of opmerking) en geen KT/NKT-criteria

### Wijzigingen

**`src/pages/ProjectDetail.tsx`**:

1. **Bereken automatische beoordeling** — nieuw `useMemo`/berekend veld na de bestaande EP2-berekeningen (regel ~452):
   - Tel `niet_goed` findings
   - Pas de drie KT-regels toe
   - Bepaal KT / NKT / GOED

2. **Auto-fill bij wijziging** — `useEffect` die `ep2Beoordeling` zet wanneer start/eindwaarde of findings wijzigen, maar alleen als de auditor niet handmatig heeft overschreven (track via een `ep2ManualOverride` state)

3. **Dropdown opties wijzigen** — van "goed"/"niet_goed" naar "goed"/"nkt"/"kt" met labels "GOED", "NKT", "KT"

4. **Toon berekende suggestie** — klein infoblok onder de beoordeling-select dat uitlegt waarom de automatische waarde is gekozen (bijv. "Automatisch: KT — afwijking 9.2% bij EP2 > 125")

5. **Override mogelijk** — auditor kan altijd handmatig de waarde wijzigen; bij handmatige wijziging wordt een `(handmatig)` label getoond

### Technisch detail

```text
// Pseudo-logica
const nietGoedCount = findings.filter(f => f.beoordeling === "niet_goed").length;
const alleGoed = findings.every(f => f.beoordeling === "goed" || f.beoordeling === "opmerking" || !f.beoordeling);

let autoEp2 = "goed";
if (afwijkingAbs !== null && eindVal > 125 && Math.abs(afwijkingPct) > 8) autoEp2 = "kt";
else if (afwijkingAbs !== null && eindVal <= 125 && Math.abs(afwijkingAbs) > 10) autoEp2 = "kt";
if (nietGoedCount > 4) autoEp2 = "kt";
else if (!alleGoed && autoEp2 !== "kt") autoEp2 = "nkt";
if (alleGoed && autoEp2 !== "kt") autoEp2 = "goed";
```

### Database

De `ep2_beoordeling` kolom is al een vrij tekstveld — geen migratie nodig. De waarden worden "goed", "nkt", "kt".

### Bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | Auto-berekening EP2-beoordeling, dropdown opties KT/NKT/GOED, override-tracking, info-uitleg |

