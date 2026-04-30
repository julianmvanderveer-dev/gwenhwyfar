## Plan: nieuw reactietermijn-regime + escalerende herinneringen

### Doel
Eén consistent termijn-regime voor de hele communicatie tussen Auditor/Tekenaar en EP-adviseur. De 3-maanden hersteldeadline op 'Niet goed' bevindingen vervalt volledig. Alle termijnen en escalaties worden gemeten vanaf de **laatste actie** (= laatste statuswijziging in de communicatie-cyclus).

### Termijnen (gemeten vanaf laatste actie)
| Trigger (= laatste actie) | Reactietermijn voor EP-adviseur |
|---|---|
| Auditor rondt audit af | 2 weken |
| Auditor/tekenaar wijst reactie af ("Niet akkoord") | 1 week |

### Escalerende mails naar EP-adviseur (CC `julian@borgch.nl`)
Alle momenten gemeten vanaf de actuele `reactie_deadline`:
1. **T-1 dag** (vóór deadline) — vriendelijke herinnering
2. **T+7 dagen** — herinnering: "deadline een week verstreken"
3. **T+14 dagen** — serieuze waarschuwing
4. **T+21 dagen** — eindwaarschuwing met aankondiging dat het label over een week ingetrokken kan worden
5. (T+28 dagen = label kan ingetrokken worden — dit is een handmatige actie van Beheer/Auditor; het systeem markeert het project alleen als "label-intrekking aanstaande" en stuurt geen verdere mails)

Elke mail wordt maximaal 1× per cyclus verstuurd. **Bij elke nieuwe actie van Auditor/Tekenaar wordt de cyclus gereset** (nieuwe deadline + alle vlaggen weer op false), zodat de teller altijd vanaf de laatste actie loopt.

### Aanpassing 1 — `src/pages/ProjectDetail.tsx` (`auditAfronden`)
- Verwijder `findings.deadline = addMonths(now, 3)` volledig (en de import `addMonths` indien ongebruikt).
- Verwijder `findings.deadline` uit alle update-statements bij audit afronden.
- `projects.reactie_deadline = now + 14 dagen`.
- Reset `reminder_*_sent` vlaggen op false.
- Toast: "Reactietermijn 2 weken ingesteld".

### Aanpassing 2 — `src/pages/FindingBeoordeling.tsx` (`nietAkkoord`)
- Update bovenliggend project: `reactie_deadline = now + 7 dagen`, `status = 'wacht_op_reactie'`, alle `reminder_*_sent` vlaggen op false.
- Geen wijziging aan `findings.deadline`.

### Aanpassing 3 — UI cleanup (3-maanden weergave verwijderen)
- `src/pages/FindingBeoordeling.tsx` regel 238: regel met `<strong>Deadline:</strong> {finding.deadline ...}` verwijderen.
- `src/pages/FindingReactie.tsx` regel 192: idem.
- `findings.deadline` kolom blijft in de database staan (geen migratie nodig om de kolom te droppen; we vullen hem gewoon niet meer).

### Aanpassing 4 — migratie + backfill lopende projecten
Migratie:
- Vier booleans op `projects` (default `false`):
  `reminder_pre_sent`, `reminder_overdue_1w_sent`, `reminder_overdue_2w_sent`, `reminder_overdue_3w_sent`.
- Backfill voor lopende projecten met `status = 'wacht_op_reactie'`:
  `reactie_deadline = now() + interval '14 days'` (volledige reset op nieuwe norm; bij twijfel vergeven we adviseurs eenmalig de korte herstart). Vlaggen op `false`.

### Aanpassing 5 — edge function `reactie-herinneringen` (dagelijkse cron)
Selectie: projecten met `status = 'wacht_op_reactie'` en open EP-adviseur-bevindingen (`zichtbaar_voor_adviseur = true`, `status NOT IN ('reactie_ontvangen','reactie_goedgekeurd','gesloten')`).

Per project, in volgorde van zwaarste eerst (zodat één project max 1 mail per dag krijgt):
- `now ≥ deadline + 21d` en `!reminder_overdue_3w_sent` → template `reactie-herinnering-eindwaarschuwing` + vlag op true.
- `now ≥ deadline + 14d` en `!reminder_overdue_2w_sent` → template `reactie-herinnering-waarschuwing` + vlag.
- `now ≥ deadline + 7d` en `!reminder_overdue_1w_sent` → template `reactie-herinnering-overdue` + vlag.
- `deadline - now ≤ 24h` en `now < deadline` en `!reminder_pre_sent` → template `reactie-herinnering-pre` + vlag.

Verstuurt via bestaande `send-transactional-email` met dezelfde adviseur-lookup en CC als `notify-adviseur`.

### Aanpassing 6 — vier nieuwe e-mailtemplates
In `supabase/functions/_shared/transactional-email-templates/` + registratie in `registry.ts`:
- `reactie-herinnering-pre.tsx` — "Uw reactietermijn voor project X verloopt morgen"
- `reactie-herinnering-overdue.tsx` — "Reactietermijn project X is een week verstreken"
- `reactie-herinnering-waarschuwing.tsx` — "Waarschuwing: reactietermijn project X is twee weken verstreken"
- `reactie-herinnering-eindwaarschuwing.tsx` — "Laatste waarschuwing: zonder reactie kan label over een week ingetrokken worden"

Stijl identiek aan `niet-akkoord.tsx` (BengCert huisstijl, `#1e3a5f`); toon escalerend (vriendelijk → serieus → laatste waarschuwing).

### Aanpassing 7 — pg_cron (dagelijks 07:00 UTC ≈ 08:00/09:00 NL)
Via insert-tool (bevat anon key, geen migratie):
`cron.schedule('reactie-herinneringen-daily', '0 7 * * *', $$ select net.http_post(url:='.../functions/v1/reactie-herinneringen', headers:=...) $$);`

### Aanpassing 8 — geheugen
`mem://logica/deadline-berekening` herschrijven:
- 3-maanden hersteldeadline op bevindingen vervalt.
- Reactietermijn = 2 weken na auditafronding, 1 week na 'Niet akkoord'.
- Cyclus reset bij elke actie van Auditor/Tekenaar.
- Escalerende herinneringen op T-1, T+7, T+14, T+21.

### Resultaat
- Eén kort, helder reactie-regime; 3-maanden constructie is volledig weg.
- Escalerende, automatische herinneringen vanaf de laatste actie.
- Reset bij elke nieuwe Auditor/Tekenaar-actie zorgt dat de teller eerlijk vanaf het laatste contactmoment loopt.
- Lopende projecten krijgen direct de nieuwe norm (eenmalige reset naar 14 dagen).
