## Wijziging EP2 KT-criterium (aantal afwijkingen)

In de automatische EP2-beoordeling wordt op dit moment `KT` toegekend zodra er meer dan 4 bevindingen met beoordeling "Niet goed" zijn — ongeacht of die afwijking < 1% is.

### Nieuwe regel
- Tel bij het KT-criterium alleen "Niet goed"-bevindingen waarvan de checkbox **"Afwijking < 1%"** NIET is aangevinkt.
- Pas als dit aantal **> 4** is, wordt automatisch KT toegekend op basis van het aantal afwijkingen.
- Bevindingen met "Afwijking < 1%" tellen dus niet mee voor dit criterium (ze blijven wel meetellen voor NKT, zoals nu).

### Wijzigingen in code
Bestand: `src/pages/ProjectDetail.tsx`

1. In `autoEp2` (useMemo) een nieuwe teller toevoegen:
   ```ts
   const nietGoedRelevantCount = findings.filter(
     (f) => f.beoordeling === "niet_goed" && !(f as any).afwijking_kleiner_1pct
   ).length;
   ```
   en de bestaande check `if (nietGoedCount > 4)` vervangen door `if (nietGoedRelevantCount > 4)`.

2. In `autoEp2Reden` dezelfde teller gebruiken en de tekst aanpassen naar bv.  
   `"${nietGoedRelevantCount} afwijkingen ≥ 1% (> 4)"`.

De EP2-grenswaardencriteria (afwijking in kWh/m² of %) blijven ongewijzigd. De NKT-fallback (één of meer fouten, geen KT) blijft ook op het totale aantal "Niet goed"-bevindingen werken, zodat een project met alleen kleine afwijkingen nog steeds als NKT (niet GOED) wordt gemarkeerd.

### Geen wijziging nodig
- `generateAuditReport.ts`: gebruikt alleen de opgeslagen `ep2_beoordeling`.
- Database: het veld `afwijking_kleiner_1pct` bestaat al op `findings`.