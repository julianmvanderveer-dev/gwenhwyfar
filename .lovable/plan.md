

## Plan: Projecten-pagina redesign met fasekolommen

### Wat verandert

De huidige tabel-weergave voor interne rollen (beheer/tekenaar/auditor) op `src/pages/Inbox.tsx` wordt vervangen door een visuele fase-gegroepeerde weergave met kaarten, zoekfunctie en uitgebreide export.

### Mapping fases → bestaande DB-statussen

| Fase in design | DB project_status | Opmerking |
|---|---|---|
| 1. Nieuwe projecten | `nog_niet_begonnen` | |
| 2. Deel 1 bezig | `deel1_bezig` | |
| 3. Wacht op deel 2 | `deel1_afgerond` | |
| 4. Deel 2 bezig | `deel2_bezig` | |
| 5. Wacht op reactie EP | `wacht_op_reactie` | |
| 6. Afgerond | `afgerond` | Alleen als gearchiveerd_op < 14 dagen |
| 7. Reactie ontvangen | `wacht_op_reactie` + findings met status `reactie_ontvangen` | Afgeleid, geen nieuwe DB-status nodig |

### Database wijzigingen

Geen. Fase 7 ("reactie ontvangen") wordt client-side bepaald door te kijken of een project met status `wacht_op_reactie` findings heeft met `finding_status = reactie_ontvangen`.

### Bestanden

#### 1. `src/pages/Inbox.tsx` — Volledige herschrijving interne sectie

- **Data laden**: Bestaande `loadInternalData` uitbreiden om ook findings per project op te halen (nodig voor fase 7 detectie en KT/NK badges)
- **Zoekbalk**: Filter op projectnaam, adviseur
- **Fase-kolommen**: Projecten groeperen per fase, weergeven als `Card` componenten met kleuren/icons uit het design
- **Per project-kaart**: Projectnaam (link naar detail), categorie, soort, prioriteit badge, toelatingsaudit badge, adviseur, aanmaakdatum, deadline (bij wacht_op_reactie)
- **Tabbladen**: "Kolomweergave" (cards naast elkaar in grid) en "Onder elkaar" (lijst)
- **Fase-tellers**: Bovenaan tonen hoeveel projecten per fase
- **Export sectie**: Filter op jaar + datumrange, CSV download via bestaande `downloadCsv` functie
- **Beheer-acties**: Nieuw project + verwijderen blijven beschikbaar
- **EP-adviseur sectie** en **findings te beoordelen** blijven ongewijzigd

#### 2. `src/lib/badges.tsx` — Geen wijzigingen nodig

Bestaande `statusBadge` wordt hergebruikt in de kaarten.

### Technische details

- Fase 7 detectie: Na laden van projecten met status `wacht_op_reactie`, query findings met `status = reactie_ontvangen` per project. Als gevonden → toon in fase 7, anders in fase 5.
- Archivering: `afgerond` projecten met `gearchiveerd_op` ouder dan 14 dagen (aangepast van 7 naar 14 conform design) worden gefilterd.
- Export: Uitgebreid met jaar-selectie en datumrange filter. Kolommen uitgebreid met tekenaar/auditor (niet beschikbaar in huidige DB → wordt weggelaten of later toegevoegd).

