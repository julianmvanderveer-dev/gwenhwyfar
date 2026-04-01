

## Aangepast plan: Reactiestroom en rechten aanscherpen

Het eerder goedgekeurde plan wordt op punt 5 aangepast: de auditor kan **alles** wat de tekenaar kan, inclusief het invullen van de EP2-startwaarde.

### Wijzigingen (5 punten)

#### 1. Reacties EP-adviseur altijd eerst naar auditor
Bij `auditAfronden` in `ProjectDetail.tsx`: zet `toegewezen_beoordelaar` naar de huidige auditor (`user.id`) voor alle findings die zichtbaar worden voor de adviseur.

#### 2. Auditor kan finding doorzetten naar tekenaar
In `FindingBeoordeling.tsx`: voeg een "Doorzetten naar tekenaar" actie toe met dropdown van beschikbare tekenaars (gefilterd op audit-categorie). Update `toegewezen_beoordelaar` en maak notificatie aan.

#### 3. Alleen auditor kan audit afronden
De `auditAfronden`-functie bevat al de `canDeel2`-guard. Extra defensieve check: verifieer `hasRole("auditor")` voordat status wordt bijgewerkt.

#### 4. Auditor kan deel 1 inzien en bewerken
Pas `canEditFindingByDeel` aan zodat auditors **altijd** kunnen bewerken (deel 1 en 2):

```text
canEditFindingByDeel = (deel) => {
  if (canDeel1 && deel === 1) return true;
  if (canDeel2) return true;  // auditor mag alles
  return false;
}
```

#### 5. EP2-startwaarde: auditor en tekenaar beide
**Gewijzigd t.o.v. vorig plan**: De startwaarde is bewerkbaar wanneer `canDeel1 || canDeel2` (dus zowel tekenaar als auditor). Eindwaarde en beoordeling blijven `canDeel2` only. De EP2 opslaan-knop is zichtbaar bij `canDeel1 || canDeel2`.

Concreet in `ProjectDetail.tsx` regel 758: `disabled={!canDeel2}` wordt `disabled={!(canDeel1 || canDeel2)}`.

---

### Bestanden

| Bestand | Wijzigingen |
|---------|------------|
| `src/pages/ProjectDetail.tsx` | Punten 1, 3, 4, 5 |
| `src/pages/FindingBeoordeling.tsx` | Punt 2: doorzetten naar tekenaar |

