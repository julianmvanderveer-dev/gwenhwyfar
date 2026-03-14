

## Statuslabels en filtering in "Mijn projecten" voor tekenaar/auditor

### Context

De tekenaar ziet nu "Starten" of "Openen" — dat is niet informatief. De gebruiker wil zien wat de actuele status is van het project, en projecten die niet meer relevant zijn moeten verdwijnen.

### Statusmapping per rol

**Voor tekenaar:**

| `project.status` | Label | Klikbaar? | Zichtbaar? |
|---|---|---|---|
| `nog_niet_begonnen` | **Starten** | Ja → projectdetail | Ja |
| `deel_1_bezig` | **Mee bezig** | Ja → projectdetail | Ja |
| `deel_1_afgerond` | **Bij auditor** | Nee (badge) | Ja |
| `deel_2_bezig` | **Bij auditor** | Nee (badge) | Ja |
| `wacht_op_reactie` | **Reactie gevraagd** | Nee (badge) | Ja |
| `afgerond` | — | — | **Nee** (verdwijnt) |

Projecten zonder KT/NK-afwijkingen na deel 1 (status springt naar `afgerond`) verdwijnen automatisch doordat we al `neq("status", "afgerond")` filteren.

**Voor auditor** (vergelijkbare logica, maar dan vanuit auditor-perspectief):

| `project.status` | Label | Klikbaar? | Zichtbaar? |
|---|---|---|---|
| `deel_1_afgerond` | **Starten** | Ja → projectdetail | Ja |
| `deel_2_bezig` | **Mee bezig** | Ja → projectdetail | Ja |
| `wacht_op_reactie` | **Reactie gevraagd** | Nee (badge) | Ja |
| `nog_niet_begonnen` | — | — | **Nee** |
| `deel_1_bezig` | — | — | **Nee** |

### Wijziging

**Bestand: `src/components/dashboard/MedewerkerDashboard.tsx`**

1. **Filterlogica** (regels 125-127): Na de huidige filter, extra filter op basis van rol:
   - Tekenaar: verberg niets extra (afgerond is al gefilterd)
   - Auditor: verberg `nog_niet_begonnen` en `deel_1_bezig` (niet relevant voor auditor)

2. **Statusweergave** (regels 222-235): Vervang `isNew`-logica door een helper `getStatusLabel(status, rol)` die het juiste label en gedrag teruggeeft:
   - Klikbare statussen ("Starten", "Mee bezig") → Link + Button naar projectdetail
   - Informatieve statussen ("Bij auditor", "Reactie gevraagd") → Badge (secondary), niet klikbaar

3. **Kolomheader** (regel 218): Hernoem "Actie" → "Status"

