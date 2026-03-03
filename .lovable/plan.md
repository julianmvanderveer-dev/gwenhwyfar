

## Plan: Projectstatus-workflow herziening

### Huidige situatie
De `project_status` enum heeft: `geselecteerd`, `deel1_bezig`, `wacht_op_deel2`, `afgerond`, `reactie_open`, `gesloten`.

### Gewenste statussen
1. **nog_niet_begonnen** — Tekenaar heeft project nog niet geopend (vervangt `geselecteerd`)
2. **deel1_bezig** — Tekenaar is ermee bezig (blijft)
3. **deel1_afgerond** — Tekenaar klaar, auditor moet deel 2 doen (vervangt `wacht_op_deel2`)
4. **deel2_bezig** — Auditor is bezig (nieuw)
5. **afgerond** — Geen KT/NK, ter info naar EP-adviseur, na 1 week archiveren (blijft, maar andere betekenis)
6. **wacht_op_reactie** — Wacht op reactie EP-adviseur, met deadline (vervangt `reactie_open`)
7. **gesloten** — Gearchiveerd (blijft)

### Wijzigingen

#### 1. Database migratie
- Voeg nieuwe enum-waarden toe: `nog_niet_begonnen`, `deel1_afgerond`, `deel2_bezig`, `wacht_op_reactie`
- Migreer bestaande data: `geselecteerd` → `nog_niet_begonnen`, `wacht_op_deel2` → `deel1_afgerond`, `reactie_open` → `wacht_op_reactie`
- Verwijder oude waarden (via recreatie van enum, want PostgreSQL kan geen waarden verwijderen)
- Voeg `reactie_deadline` kolom toe aan `projects` (timestamptz, nullable)
- Voeg `gearchiveerd_op` kolom toe aan `projects` (timestamptz, nullable) — voor de 1-week logica

#### 2. `src/lib/badges.tsx` — statusBadge updaten
- Nieuwe labels en kleuren voor alle statussen
- `wacht_op_reactie` met oranje (NK) of rode (KT) codering afhankelijk van de ergste finding

#### 3. `src/pages/Beheer.tsx` — Projecten-tab updaten
- Toon `reactie_deadline` kolom bij `wacht_op_reactie`
- Kleurcodering KT (rood) en NK (oranje) bij wacht_op_reactie status

#### 4. `src/pages/ProjectDetail.tsx` — Statuslabels en workflow updaten
- Update `statusLabel` map
- `canDeel1` check: `nog_niet_begonnen` of `deel1_bezig`
- `canDeel2` check: `deel1_afgerond` of `deel2_bezig`
- `deel1Afronden`: status → `deel1_afgerond`
- `auditAfronden`: check of er KT/NK findings zijn. Zo niet → `afgerond` + `gearchiveerd_op = now()`. Zo ja → `wacht_op_reactie` + bereken `reactie_deadline` (KT: 1 maand, NK: 3 maanden, neem de kortste)
- Auto-set `deel1_bezig` of `deel2_bezig` wanneer tekenaar/auditor project opent en status nog `nog_niet_begonnen`/`deel1_afgerond`

#### 5. `src/pages/Inbox.tsx` — Statuslabels updaten
- Update `statusLabel` map
- Filter: toon `afgerond` projecten alleen als `gearchiveerd_op` < 1 week geleden

#### 6. Archivering na 1 week
- In de Inbox/Beheer query: projecten met status `afgerond` en `gearchiveerd_op` ouder dan 7 dagen worden als `gesloten` getoond of gefilterd. Implementeer dit client-side bij laden, of via een simpele check die status naar `gesloten` zet.

### Deadline-logica bij `wacht_op_reactie`
- Kijk naar ergste finding-type: als er minstens 1 KT is → deadline = 1 maand. Anders (alleen NK) → deadline = 3 maanden.
- Sla op in `projects.reactie_deadline`.
- Toon in Beheer met kleurcodering: rood als KT-findings, oranje als alleen NK-findings.

