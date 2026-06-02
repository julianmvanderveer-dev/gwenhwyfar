## Doel
EP-adviseurs ontvangen bij uitnodiging een mail met hun e-mailadres + standaardwachtwoord `BengCert26`. Ze kunnen direct inloggen (zonder "wachtwoord vergeten"-flow) en hun wachtwoord daarna zelf wijzigen via een profielinstelling.

## Wijzigingen

### 1. Edge function `create-team-member` — nieuwe actie `create_adviseur_account`
- Input: `email`, `naam`
- Check beheer-rol (zoals nu)
- Controleer of er al een auth-user bestaat met dit e-mailadres:
  - Zo ja → skip aanmaak, geef terug dat account al bestaat (mail wordt nog wel verzonden met instructie "log in met je bestaande wachtwoord, of gebruik 'wachtwoord vergeten'")
  - Zo nee → `auth.admin.createUser({ email, password: "BengCert26", email_confirm: true, user_metadata: { naam } })`
- Bestaande trigger `link_user_to_adviseur` koppelt automatisch het `adviseurs`-record en wijst de `ep_adviseur`-rol toe op basis van e-mail
- Return `{ created: true|false, exists: bool }`

### 2. `src/pages/Beheer.tsx` — `sendPlatformInvite` aanpassen
Voor het versturen van de platform-uitnodigingsmail eerst `create-team-member` aanroepen met `action: "create_adviseur_account"`. Daarna pas `send-transactional-email` met template `platform-uitnodiging` (krijgt nu ook `bestaatAl` flag mee voor juiste copy).

Geldt voor zowel:
- `sendPlatformInvite` (knop per adviseur in lijst)
- `sendLossePlatformInvite` (losse uitnodiging zonder adviseur-record — hier alleen mail, geen account; want geen e-mail bekend in adviseurs-tabel… check: deze heeft wél email-input → ook account aanmaken)

### 3. Email template `platform-uitnodiging.tsx` — herschrijven
Vervang stappen 1-4 door:
1. Klik op de knop hieronder om naar BengCert te gaan.
2. Log in met je e-mailadres en het standaardwachtwoord: **BengCert26**
3. Wijzig na inloggen je wachtwoord via "Mijn account" rechtsboven.

Template ontvangt extra prop `wachtwoord` (default `"BengCert26"`) zodat we dit niet hardcoderen in copy.

### 4. Wachtwoord wijzigen in app
Toevoegen aan bestaande UI: een "Wachtwoord wijzigen"-knop/dialog in de header van `AppLayout.tsx` (user-menu). Dialog met velden nieuw wachtwoord + bevestig, roept `supabase.auth.updateUser({ password })` aan.

### 5. Optioneel: forceren wachtwoordwijziging bij eerste login
**Niet meenemen** tenzij gewenst — voor nu alleen passieve mogelijkheid om wachtwoord te wijzigen. Adviseur kan `BengCert26` houden tot hij zelf wijzigt.

## Buiten scope
- `resend_invite` flow voor beheer/auditor/tekenaar (die blijft `auth.admin.inviteUserByEmail` gebruiken)
- Force-reset op eerste login

## Technische details
- Wachtwoord `"BengCert26"` als constante in edge function (niet in client; client zou het nooit moeten weten)
- `email_confirm: true` zodat geen verificatie-mail van Supabase nodig is
- Bij `createUser` errors die "already registered" bevatten: behandel als `exists: true` zonder fout
- Trigger `link_user_to_adviseur` is al actief op `auth.users` insert — geen DB-migratie nodig
