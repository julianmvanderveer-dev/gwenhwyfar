## Probleem

`notify-adviseur` met `type: "audit_afgerond"` stuurt altijd template `audit-afgerond` ("Auditrapport klaar voor uw reactie"). Dat is twee dingen tegelijk:

1. **Bedoeld als reactie-uitnodiging** vanuit `ProjectDetail.finalize()` wanneer status → `wacht_op_reactie`.
2. **Bedoeld als afrondingsmail** vanuit `useBatchVersturen` wanneer alle bevindingen dicht zijn (status → `afgerond`), én vanuit `finalize()` wanneer er geen niet-goed bevindingen waren.

Resultaat: een EP-adviseur (bv. Dennis van Langen, P24007-01) krijgt "Auditrapport klaar voor uw reactie" terwijl de audit al afgerond is. Bovendien checkt `notify-adviseur` de huidige projectstatus niet vlak vóór verzenden — een vertraagde invocation kan alsnog uitgaan na afronding.

## Wijzigingen

### 1. Nieuwe template `audit-volledig-afgerond`
`supabase/functions/_shared/transactional-email-templates/audit-volledig-afgerond.tsx` — kopie van `audit-afgerond.tsx` qua opmaak (zelfde container/heading/button styles, zelfde `SITE_NAME`/`SITE_URL`), maar:

- Preview/Heading/Subject: "Audit afgerond: {projectnaam}"
- Body: "De audit voor project **{projectnaam}** is afgerond. Er is geen reactie meer nodig. U kunt het auditrapport bekijken en downloaden via onderstaande knop."
- Button-tekst: "Bekijk de audit"
- Onder de knop een kleine secundaire tekst/link: "Of download direct het rapport (PDF)" → linkt naar `/project/{id}` (PDF wordt via `window.print()` in de app gegenereerd; aparte download-route bestaat niet, dus één knop volstaat — secundaire regel mag wegblijven als dat eenvoudiger is).

Registreer in `supabase/functions/_shared/transactional-email-templates/registry.ts` onder key `audit-volledig-afgerond`.

### 2. `notify-adviseur` — statuscheck + nieuw type

`supabase/functions/notify-adviseur/index.ts`:

- Accepteer een derde `type`: `audit_volledig_afgerond` → template `audit-volledig-afgerond`.
- Lees `projects.status` mee in de bestaande project-query.
- **Vlak vóór verzenden** een routing/guard toevoegen:
  - `type === "audit_afgerond"` (de reactie-uitnodiging) én `project.status !== "wacht_op_reactie"` → niet versturen. Als status `afgerond` is, automatisch herschalen naar `audit_volledig_afgerond` zodat een queued/vertraagde invocation alsnog de juiste mail oplevert; bij andere statussen gewoon overslaan met `skipped: true` in de response en een log-regel.
  - `type === "audit_volledig_afgerond"` én `project.status !== "afgerond"` → overslaan (defensief).
  - `type === "niet_akkoord"` blijft ongewijzigd.

Hiermee is bug 1 (verwarrende mail na afronding) ook gedekt voor reeds geplande/queued aanroepen.

### 3. Call sites bijwerken

`src/pages/ProjectDetail.tsx` in `finalize()`:
- Tak `hasNietGoed === true` (status → `wacht_op_reactie`): blijft `type: "audit_afgerond"` (= "klaar voor uw reactie"). Geen verandering.
- Tak `hasNietGoed === false` (status → `afgerond`): wijzig naar `type: "audit_volledig_afgerond"`.

`src/hooks/useBatchVersturen.ts` in het blok waar alle bevindingen dicht zijn en status → `afgerond` wordt gezet: wijzig de `notify-adviseur` invocation van `type: "audit_afgerond"` naar `type: "audit_volledig_afgerond"`. `notify-auditor` blijft ongewijzigd (gebruikt eigen `audit-afgerond-auditor` template).

### 4. Deploy

Na het toevoegen/wijzigen van templates en edge functions: `deploy_edge_functions` voor `notify-adviseur` en `send-transactional-email`.

## Niet gewijzigd

- `audit-afgerond.tsx` template-bestand zelf (blijft de reactie-uitnodiging — naam laten we staan om bestaande idempotency-keys/log-historie consistent te houden).
- `notify-auditor`, herinneringsmails, RLS, DB-schema, queue/cron.
- `create-team-member` (gebruikt `audit-afgerond` voor uitnodigingsnotificatie aan Julian — los gebruik, blijft werken).
