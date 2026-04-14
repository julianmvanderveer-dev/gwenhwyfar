

## Plan: Michel de Graaf uitnodigen als gebruiker

### Huidige situatie
- Michel de Graaf staat in de `adviseurs` tabel (email: `MdeGraaf@selekthuis.nl`)
- Er is geen `auth.users` account voor hem — hij kan niet inloggen
- De `create-team-member` Edge Function ondersteunt een invite-modus die `inviteUserByEmail` aanroept

### Wat er moet gebeuren

1. **Roep de `create-team-member` Edge Function aan** met:
   - `naam`: "Michel de Graaf"
   - `email`: "MdeGraaf@selekthuis.nl"
   - `invite`: true
   - `roles`: ["ep_adviseur"]
   
   Dit maakt een auth-account aan en stuurt automatisch een uitnodigingsmail via Supabase Auth.

2. **Verificatie**: Controleer dat het account is aangemaakt en de adviseur-record gekoppeld is (user_id gevuld).

### Aandachtspunt
- De uitnodigingsmail wordt verstuurd via het auth-email-hook systeem (Resend, `noreply@bengaudit.nl`). Dit werkt omdat we eerder het e-mailsysteem via Resend hebben opgezet.
- Michel krijgt een link waarmee hij een wachtwoord kan instellen en direct kan inloggen.

### Technisch detail
- De Edge Function `create-team-member` vereist een ingelogde beheerder. De aanroep wordt gedaan met jouw huidige sessie-token.

