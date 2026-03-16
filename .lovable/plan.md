

## Plan: EPU-B en EPU-D checklists toevoegen

### Overzicht
Twee nieuwe checklist-databestanden aanmaken (EPU-B gebaseerd op EPW-B, EPU-D gebaseerd op EPW-D), beide uitgebreid met 4 extra controlepunten. Daarnaast de database vullen met templates en de UI's updaten zodat EPU-B/D overal ondersteund worden.

### Wijzigingen

#### 1. Nieuwe databestanden
- **`src/data/epub-checklist.ts`** — Kopie van EPW-B, plus:
  - `3h`: "Is er een duidelijke tekening met functie-indeling aanwezig?" (deel 2)
  - `3i`: "Zijn de hulpfuncties juist toebedeeld aan gebruiksfuncties?" (deel 2)
  - `5j`: "Verlichting - correct vermogen?" (deel 2)
  - `5k`: "Verlichting - correcte schakeling?" (deel 2)

- **`src/data/epud-checklist.ts`** — Kopie van EPW-D, plus dezelfde 4 extra items (3h, 3i, 5j, 5k)

#### 2. Database migratie
- INSERT alle EPU-B en EPU-D rijen in `checklist_templates` tabel, zodat ze via ChecklistBeheer bewerkbaar zijn

#### 3. `src/pages/ChecklistBeheer.tsx`
- Tabs uitbreiden met EPU-B en EPU-D (naast bestaande EPW-B/EPW-D)

#### 4. `src/pages/ProjectAanmaken.tsx`
- Importeer EPU-B/D checklists als fallback
- Breid de template-query uit zodat EPU-B/D ook uit `checklist_templates` geladen worden (momenteel alleen EPW-B/D)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/data/epub-checklist.ts` | Nieuw: EPU-B checklist data |
| `src/data/epud-checklist.ts` | Nieuw: EPU-D checklist data |
| Database migratie | INSERT EPU-B en EPU-D rijen in checklist_templates |
| `src/pages/ChecklistBeheer.tsx` | Tabs toevoegen voor EPU-B en EPU-D |
| `src/pages/ProjectAanmaken.tsx` | Fallback en template-query uitbreiden voor EPU-B/D |

