## Doel
'N.V.T.' (Niet van toepassing) toevoegen als vierde keuze in de checklist, naast Goed, Niet goed en Opmerking. Gedrag: volledig neutraal — geen status-impact, geen verplichte toelichting, telt niet mee in de EP2-berekening, gaat niet naar de EP-adviseur.

## Wijzigingen

### 1. Database
- Nieuwe waarde `nvt` toevoegen aan enum `beoordeling_type` (migratie).

### 2. Checklist UI (`src/pages/ProjectDetail.tsx`)
- Extra `<option value="nvt">N.V.T.</option>` in de beoordeling-dropdown.
- `updateBeoordeling`: bij `nvt` géén `eigenaar_beoordeling`/`toegewezen_beoordelaar` zetten en de status onveranderd laten (dus géén automatische `gesloten`/`open`-wisseling).
- Labelmap in `handleBeoordeling` uitbreiden met `nvt: "N.V.T."` voor correctie-logging.
- Toelichtingsblok blijft alleen verschijnen bij `niet_goed`/`opmerking` (N.V.T. krijgt geen toelichtingsregel).
- "Alles goedkeuren" blijft `niet_goed`/`opmerking` overslaan; N.V.T.-rijen worden niet overschreven (filter `f.beoordeling !== "goed" && f.beoordeling !== "nvt"`).
- EP2-tellingen: N.V.T. zit niet in `niet_goed`/`opmerking`-filters, dus telt automatisch niet mee — bevestigen door inspectie van `useMemo`-blokken.

### 3. Badge (`src/lib/badges.tsx`)
- `beoordelingBadge`: label `N.V.T.`, neutrale grijze styling (`bg-gray-100 text-gray-700`).

### 4. Rapportage & export
- `src/lib/generateAuditReport.ts`: N.V.T.-bevindingen niet opnemen in afwijkingen-secties; alleen tonen als 'N.V.T.' in eventuele volledige checklist-weergave.
- CSV/PDF-exports: label-mapping uitbreiden zodat 'nvt' netjes als 'N.V.T.' verschijnt waar de waarde voorkomt.

### 5. Filters/overzichten elders
- Zoekopdracht door codebase op `"niet_goed"`/`"opmerking"`/`"goed"` om plekken te vinden waar een expliciete lijst van beoordelingen gebruikt wordt (bv. dashboards, e-mailcontent, herinneringen). N.V.T. wordt overal als 'neutraal' behandeld: niet meenemen in waarschuwingen, deadlines, of EP-adviseur-cycli.

## Validatie
- Migratie draait succesvol; enum bevat `nvt`.
- Op een testproject: N.V.T. kiezen wijzigt status niet, vraagt geen toelichting, geen reactieverzoek aan EP-adviseur, en EP2-percentage blijft gelijk.
- Bestaande Goed/Niet goed/Opmerking-flows ongewijzigd.
