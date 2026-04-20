

## Plan: Uitnodiging opnieuw versturen naar Rob Harbers + Julian CC

### Situatie
- Rob Harbers (`info@kampermanadviseurs.nl`) heeft op 15-04 een uitnodiging gehad via `notify-adviseur` (auto-invite), maar `email_confirmed_at` is nog `null` en hij heeft de mail naar eigen zeggen niet ontvangen.
- De audit-afgerond mail is wel succesvol bij hem afgeleverd (`sent` in log).
- De Supabase invite-mail (verstuurd via `inviteUserByEmail`) wordt door de `auth-email-hook` afgehandeld, maar verstuurt geen CC naar Julian — dat kan namelijk niet via de Auth API.

### Actie
1. **Direct uitnodiging opnieuw versturen** naar `info@kampermanadviseurs.nl` via de bestaande `create-team-member` edge function met de `resend_invite` actie. Deze functie:
   - Roept `inviteUserByEmail` opnieuw aan → genereert een nieuwe invite-link
   - Stuurt automatisch een notificatie naar `julian@borgch.nl` (al ingebouwd in vorige iteratie)

2. **Verificatie** via `email_send_log` dat:
   - De invite-mail is verstuurd naar Rob
   - De notificatie naar Julian is verstuurd

3. **Geen code wijzigingen nodig** — de functionaliteit bestaat al sinds vorige sessie. Dit is puur een directe uitvoering.

### Technische details
- Edge function call: `POST create-team-member` met body `{ resend_invite: true, email: "info@kampermanadviseurs.nl", naam: "Rob Harbers" }`
- Na uitvoer: query `email_send_log` voor bevestiging van beide mails (Rob's invite via `auth_emails` template, Julian's notificatie via `audit-afgerond` template)
- Indien Rob de mail nogmaals niet ontvangt: vragen om spam-folder te controleren en `suppressed_emails` tabel te raadplegen voor zijn adres

