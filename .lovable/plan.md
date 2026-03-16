

## Plan: Toewijzing wijzigen vanuit projectoverzicht (Inbox)

### Wat
Een hertoewijzings-actie toevoegen per project-rij in de FaseTabel op het projectoverzicht, zodat beheerders direct vanuit `/inbox` een project kunnen hertoewijzen of terugplaatsen in de pool — zonder naar Beheer → Toewijzingen te hoeven navigeren.

### Wijzigingen

#### 1. `src/components/projecten/FaseTabel.tsx`
- Nieuwe props: `onReassign(projectId, userId)`, `onReturnToPool(projectId)`, `toewijsbarePersonen` (lijst van `{id, naam, roles}`)
- Per rij een kleine hertoewijzings-knop tonen (icoon `ArrowRightLeft`). Klikken opent inline een select-dropdown (gefilterd op tekenaar/auditor afhankelijk van fase) + bevestig/annuleer knoppen — zelfde patroon als nu in Beheer.
- "Terug naar pool"-knop tonen als project al toegewezen is.

#### 2. `src/pages/Inbox.tsx`
- Laden van `toewijsbarePersonen` (profiles + user_roles, gefilterd op tekenaar/auditor) — vergelijkbaar met hoe Beheer dit doet.
- `hertoewijzen` en `terugNaarPool` functies toevoegen (update `projects` tabel: `toegewezen_aan`, `toewijzing`, `toegewezen_op`).
- Deze doorgeven aan `FaseTabel` als props.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/projecten/FaseTabel.tsx` | Props uitbreiden, inline hertoewijzing UI per rij |
| `src/pages/Inbox.tsx` | Personen laden, hertoewijzen/pool functies, props doorgeven |

