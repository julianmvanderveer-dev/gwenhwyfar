

## Plan: Uitnodiging opnieuw versturen + "Opnieuw uitnodigen"-knop in Beheer

### Stap 1: Direct uitnodiging versturen naar Michel de Graaf

Michel de Graaf (mdegraaf@selekthuis.nl) heeft een account maar heeft nooit ingelogd en zijn e-mail is niet bevestigd. We versturen opnieuw een uitnodiging via de admin API.

Dit doen we door de `create-team-member` edge function aan te roepen met zijn e-mailadres en `invite: true`. Echter, omdat het account al bestaat, zal `inviteUserByEmail` falen. In plaats daarvan gebruiken we `admin.auth.admin.generateLink({ type: 'invite', email })` om een nieuwe uitnodigingslink te genereren, en sturen die per mail.

**Alternatief (eenvoudiger):** Een nieuwe edge function `resend-invite` maken die:
1. Controleert of de caller beheerder is
2. Via `admin.auth.admin.generateLink({ type: 'magiclink', email })` een inloglink genereert
3. Een e-mail verstuurt via `send-transactional-email` met de link

### Stap 2: "Opnieuw uitnodigen"-knop in Beheer → Projectteam-tabel

In de Projectteam-tabel een knop toevoegen bij medewerkers die nog nooit hebben ingelogd (`last_sign_in_at` is null). Dit vereist:

1. **Extra data ophalen**: Bij het laden van profielen ook `last_sign_in_at` meenemen (dit zit niet in de profiles-tabel maar in auth.users). We voegen een veld `confirmed` toe aan de profiles-tabel, OF we checken het via de edge function.

   Eenvoudigere aanpak: In het `create-team-member` edge function een nieuw endpoint/actie toevoegen (`resend_invite: true`) die een bestaande gebruiker opnieuw uitnodigt.

2. **UI**: Een klein "Opnieuw uitnodigen" icoontje (RotateCcw of Mail) naast de naam of in de acties-kolom, alleen zichtbaar voor gebruikers die nog niet bevestigd zijn.

### Technische details

**Bestanden die worden gewijzigd/aangemaakt:**

1. **`supabase/functions/create-team-member/index.ts`** — Uitbreiden met `resend_invite` actie:
   - Als `resend_invite: true` en `email` is meegegeven
   - Gebruik `admin.auth.admin.generateLink({ type: 'magiclink', email })` om een link te genereren
   - Verstuur een uitnodigingsmail via `send-transactional-email` met de link
   - Of eenvoudiger: verwijder het bestaande account en maak opnieuw aan via `inviteUserByEmail`

   Beste aanpak: `admin.auth.admin.inviteUserByEmail(email)` opnieuw aanroepen — Supabase staat dit toe voor bestaande niet-bevestigde gebruikers en genereert een nieuwe invite-link.

2. **`src/pages/Beheer.tsx`**:
   - Track welke gebruikers nog niet bevestigd zijn (via een edge function call of extra veld)
   - Voeg een "Opnieuw uitnodigen" knop toe per niet-bevestigde gebruiker
   - Knop roept `create-team-member` aan met `{ email, resend_invite: true }`

3. **Directe actie**: Na deployment, de functie aanroepen voor Michel de Graaf

### Samenvatting
- Edge function uitbreiden met resend-invite mogelijkheid
- Beheer-pagina: knop voor opnieuw uitnodigen bij niet-bevestigde gebruikers
- Direct uitnodiging versturen naar Michel de Graaf

