

# Michel de Graaf uitnodigen als EP-adviseur

## Huidige situatie

- Michel de Graaf staat in de `adviseurs` tabel maar heeft geen `user_id` — hij kan niet inloggen.
- De Beheer-pagina kan teamleden aanmaken via `create-team-member`, maar dit vereist dat de beheerder handmatig een wachtwoord instelt. Er is geen uitnodigingsflow.
- De invite-e-mailtemplate bestaat al (`_shared/email-templates/invite.tsx`).
- Het e-maildomein (`notify.bengaudit.nl`) is nog in setup — zodra DNS-verificatie afgerond is, werken e-mails.

## Plan

### 1. Uitnodigingsmodus toevoegen aan `create-team-member` Edge Function
- Naast de huidige `createUser` (met wachtwoord) een `inviteUserByEmail` modus toevoegen.
- Als `password` ontbreekt of een vlag `invite: true` wordt meegegeven, wordt `adminClient.auth.admin.inviteUserByEmail()` gebruikt in plaats van `createUser`.
- Michel ontvangt dan de BengCert invite-e-mail met een link om zijn wachtwoord in te stellen.

### 2. Beheer UI aanpassen (`src/pages/Beheer.tsx`)
- Het wachtwoordveld optioneel maken: een toggle/knop toevoegen waarmee de beheerder kan kiezen tussen "Wachtwoord instellen" en "Uitnodiging versturen".
- Bij de uitnodigingsmodus: wachtwoordveld verbergen, knoptekst wijzigen naar "Uitnodigen".
- Na succesvolle uitnodiging een toast tonen: "Uitnodiging verstuurd naar [email]".

### 3. Koppeling adviseur-record
- Na het aanmaken/uitnodigen: als de nieuwe gebruiker de rol `ep_adviseur` krijgt, automatisch het `adviseurs` record met matchend e-mailadres bijwerken met de nieuwe `user_id`.
- Dit kan in de Edge Function (server-side) of na terugkeer in de UI.

### 4. Michel de Graaf uitnodigen
- Zodra e-mail werkt: via Beheer → Projectteam → "Medewerker toevoegen", naam en e-mail van Michel invullen, rol `ep_adviseur` selecteren, en "Uitnodigen" klikken.

## Technische details

| Bestand | Wijziging |
|---|---|
| `supabase/functions/create-team-member/index.ts` | `inviteUserByEmail` modus toevoegen; automatische adviseur-koppeling |
| `src/pages/Beheer.tsx` | Wachtwoord optioneel, toggle uitnodigingsmodus, UI feedback |

De `inviteUserByEmail` API van Supabase Auth stuurt automatisch een e-mail via de geconfigureerde `invite` template die al in BengCert-huisstijl is opgemaakt.

