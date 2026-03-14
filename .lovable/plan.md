

## Plan: Label wijzigen + Aandachtspunten adviseur

### 1. "Reactie gevraagd" → "Reactie EP-adviseur gevraagd"

Twee plekken in `MedewerkerDashboard.tsx` (regels 152 en 160) waar het label "Reactie gevraagd" staat. Wijzigen naar "Reactie EP-adviseur gevraagd".

Ook in `faseConfig.ts` (regel 38) de titel "Wacht op reactie EP" en de `statusBadge` in `badges.tsx` (regel 53) "Wacht op reactie" aanpassen naar "Reactie EP-adviseur gevraagd".

### 2. Aandachtspunten-veld op ProjectDetail

Een nieuw informatieveld toevoegen in de header van `ProjectDetail.tsx`, dat de top 5 meest voorkomende afwijkingen (NK/KT findings met `beoordeling = 'niet_goed'`) toont voor de gekoppelde EP-adviseur, over **alle** eerdere projecten van die adviseur.

**Logica:**
- Bij het laden van het project, de `adviseur_id` gebruiken om alle findings op te halen uit andere projecten van dezelfde adviseur
- Groepeer op `controlepunt`, tel het aantal keer dat elk controlepunt als `niet_goed` is beoordeeld
- Toon de top 5 als een compacte lijst/card onder de header

**Query (client-side):**
```sql
SELECT f.controlepunt, f.onderdeel, COUNT(*) as aantal
FROM findings f
JOIN projects p ON p.id = f.project_id
WHERE p.adviseur_id = :adviseur_id
  AND p.id != :current_project_id
  AND f.beoordeling = 'niet_goed'
GROUP BY f.controlepunt, f.onderdeel
ORDER BY aantal DESC
LIMIT 5
```

Dit wordt uitgevoerd via de Supabase client met een RPC-functie, omdat dit een aggregatiequery is die niet direct via de JS-client kan.

**Database:**
- Nieuwe database-functie `get_adviseur_aandachtspunten(adviseur_id, exclude_project_id)` die de top 5 retourneert

**UI:**
- Collapsible card/alert onder de project-header met titel "Aandachtspunten bij deze adviseur"
- Lijst met controlepunt + aantal keer afwijking
- Alleen tonen als er data is

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/dashboard/MedewerkerDashboard.tsx` | Label "Reactie EP-adviseur gevraagd" |
| `src/lib/badges.tsx` | Label aanpassen |
| `src/components/projecten/faseConfig.ts` | Titel aanpassen |
| Database migratie | Nieuwe functie `get_adviseur_aandachtspunten` |
| `src/pages/ProjectDetail.tsx` | Aandachtspunten-sectie toevoegen |

