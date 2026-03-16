

## Plan: Toewijzing beperken tot tekenaars bij aanmaken, auditor apart toewijzen

### Probleem
1. Bij project aanmaken kunnen zowel tekenaars als auditors worden geselecteerd — maar elk project moet **eerst via een tekenaar** (deel 1).
2. In het Beheer toewijzingenscherm worden ook auditors getoond bij hertoewijzing, zonder onderscheid naar projectfase.

### Gewenste situatie
- **Nieuw project**: kan alleen aan een **tekenaar** worden toegewezen (of in de pool voor tekenaars).
- **Na deel 1 afgerond**: beheerder kan een **auditor** toewijzen voor deel 2.
- Hertoewijzing in Beheer toont de juiste rolgroep afhankelijk van de projectstatus.

### Wijzigingen

#### 1. `src/pages/ProjectAanmaken.tsx`
- Filter `toewijsbarePersonen` zodat alleen personen met rol **tekenaar** getoond worden (niet auditors).
- Pas label aan: "Toewijzen aan tekenaar".

#### 2. `src/pages/Beheer.tsx` — Toewijzingen tab
- Bij hertoewijzing: toon **tekenaars** als status `nog_niet_begonnen` of `deel1_bezig`. Toon **auditors** als status `deel1_afgerond` of `deel2_bezig`.
- Bij statussen daarna (`wacht_op_reactie`, `afgerond`): hertoewijzing niet nodig of beide rollen tonen.

#### 3. Pool-logica verduidelijken
- Pool-projecten (status `nog_niet_begonnen`) worden alleen door tekenaars opgepakt. Dit is al zo via `claim_project`, maar de UI-labels moeten dit verduidelijken: "Zichtbaar voor alle tekenaars".
- Na `deel1_afgerond` moet beheerder een auditor toewijzen (of het project in een "auditor pool" plaatsen). Dit vereist een extra stap in de workflow.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectAanmaken.tsx` | Filter dropdown op alleen tekenaars |
| `src/pages/Beheer.tsx` | Hertoewijzing-dropdown filteren op basis van projectstatus |

