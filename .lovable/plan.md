

# Project 7108AA107b niet zichtbaar voor auditor

## Diagnose

Het project `7108AA107b` heeft status `deel1_afgerond` maar is nog steeds specifiek toegewezen aan Hilbert van Eenennaam. De RLS-policy op `projects` laat tekenaar/auditor alleen projecten zien als:
- `toegewezen_aan = auth.uid()` (niet het geval voor Julian), OF
- `toewijzing = 'pool'` en `toegewezen_aan IS NULL` (ook niet het geval)

Dit is exact hetzelfde probleem als eerder beschreven in het plan voor project 7108AA107c.

## Oplossing

### 1. Data fix — huidige projecten corrigeren
Alle projecten met status `deel1_afgerond` die nog specifiek toegewezen zijn, vrijgeven naar de pool:

```sql
UPDATE projects 
SET toegewezen_aan = NULL, toegewezen_op = NULL, toewijzing = 'pool'
WHERE status = 'deel1_afgerond' AND toegewezen_aan IS NOT NULL;
```

### 2. Code fix — `ProjectDetail.tsx`
In de `deel1Afronden` functie, na het updaten van de status naar `deel1_afgerond`, ook de toewijzingsvelden resetten:
- `toegewezen_aan` → `null`
- `toegewezen_op` → `null`  
- `toewijzing` → `'pool'`

Dit voorkomt dat het probleem zich herhaalt bij toekomstige projecten.

| Wijziging | Bestand |
|---|---|
| Data fix: vrijgeven naar pool | Database (via insert tool) |
| Code fix: automatisch vrijgeven na deel 1 | `src/pages/ProjectDetail.tsx` |

