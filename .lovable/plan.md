## Doel
1. **Auditor krijgt automatisch een e-mail** zodra:
   - de EP-adviseur zijn reacties heeft verstuurd, en
   - een audit als 'afgerond' wordt afgesloten.
2. **Testfase-BCC**: zolang de huidige datum vóór **1 augustus 2026** ligt, ontvangt `julian@borgch.nl` automatisch een kopie van élke transactionele e-mail die het platform verstuurt.

---

## Wijzigingen

### 1. Nieuwe e-mailtemplates (voor de auditor)
Twee nieuwe React Email templates in `supabase/functions/_shared/transactional-email-templates/`:

- **`reactie-ontvangen-auditor.tsx`** — "EP-adviseur heeft gereageerd op audit {projectnaam}". Bevat link naar het project, naam EP-adviseur en aantal reacties.
- **`audit-afgerond-auditor.tsx`** — "Audit {projectnaam} is afgerond". Korte bevestiging voor de auditor.

Beide registreren in `registry.ts`.

### 2. Nieuwe Edge Function `notify-auditor`
Analoog aan de bestaande `notify-adviseur`, maar gericht op de auditor:
- input: `{ type: "reactie_ontvangen" | "audit_afgerond", project_id }`
- haalt `projects.toegewezen_aan` op → e-mailadres uit `profiles`
- stuurt het juiste template via `send-transactional-email`
- valt stil terug (geen fout) als er geen auditor is toegewezen
- registreren in `supabase/config.toml` met `verify_jwt = false`

### 3. Aanroepen van `notify-auditor`
In `src/hooks/useBatchVersturen.ts`:
- **`verstuurAdviseur`** — na succesvol versturen van reacties: `supabase.functions.invoke("notify-auditor", { body: { type: "reactie_ontvangen", project_id: project.id }})` (fire-and-forget).
- **`verstuurAuditor`** — in het bestaande "Audit afgerond"-blok (na het updaten van `projects.status = 'afgerond'`): extra invoke met `type: "audit_afgerond"`.

### 4. Globale test-BCC tot 1 augustus 2026
In `supabase/functions/send-transactional-email/index.ts`:
- Constante `TEST_BCC = "julian@borgch.nl"` en `TEST_BCC_UNTIL = new Date("2026-08-01T00:00:00Z")`.
- Direct voor de Resend-call: als `new Date() < TEST_BCC_UNTIL`, voeg `TEST_BCC` toe aan de `cc`-array, mits het adres niet al de ontvanger of al in `cc` zit (case-insensitive dedupe).
- Hiermee verdwijnt de hardcoded `cc: "julian@borgch.nl"` in `notify-adviseur` (overbodig en zorgt anders voor dubbele kopieën) → die regel verwijderen. Ook de speciale "invite-notify" extra fetch naar Julian in `notify-adviseur` wordt overbodig en kan blijven of vereenvoudigd; in dit plan **laten staan** om bestaand gedrag niet te breken.
- Edge function herdeployen na wijziging.

### 5. Geen DB-wijzigingen
Er zijn geen schema-aanpassingen nodig. Auditor wordt via `projects.toegewezen_aan` + `profiles.email` gevonden.

---

## Technische details
- `notify-auditor` gebruikt service-role om `profiles` te lezen (RLS-bypass), net als `notify-adviseur`.
- Idempotency-key per send: `auditor-{type}-{project_id}-{timestamp}`.
- BCC-logica is bewust **CC** (niet BCC) zodat het exact aansluit op het bestaande `cc`-veld in `send-transactional-email` en de logging in `email_send_log` ongewijzigd blijft. Functioneel resultaat (Julian krijgt elke mail) is gelijk; alleen zichtbaar in de header.
- Na 1 augustus 2026 stopt de kopie automatisch — geen handmatige actie nodig.

## Open vraag
Wil je dat de extra kopie naar Julian als **CC** (zichtbaar voor ontvanger) of als **BCC** (onzichtbaar) gaat? Het huidige `send-transactional-email`-endpoint ondersteunt alleen CC; voor BCC moet ik dat veld toevoegen (kleine extra wijziging).