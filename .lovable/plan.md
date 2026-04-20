

## Plan: Aparte "Welkom op het platform" uitnodigingsmail

### Probleem
De huidige uitnodigingsmail naar nieuwe adviseurs/medewerkers is de Supabase Auth `invite` mail (`InviteEmail` template) — kort, technisch, gekoppeld aan een magic link. Julian wil een **aparte, vriendelijke mail** sturen waarin puur wordt uitgelegd:
- Dat er een platform (BengCert) is
- Dat ze een account kunnen aanmaken
- Hoe dat werkt (stappen)
- Geen koppeling aan een specifiek project of audit

### Oplossing
Een nieuwe transactionele e-mail toevoegen — `platform-uitnodiging` — die los van de Auth-flow kan worden verstuurd via `send-transactional-email`. Dit is een aparte mail naast de bestaande auth-invite. De beheerder kan deze handmatig versturen vanuit Beheer naar één persoon.

### Wat we bouwen

**1. Nieuw e-mailtemplate: `platform-uitnodiging.tsx`**
- Locatie: `supabase/functions/_shared/transactional-email-templates/platform-uitnodiging.tsx`
- Inhoud (Nederlands, BengCert huisstijl — donkerblauw #28235D, groen #5AAF2D, Poppins):
  - Onderwerp: "Welkom bij BengCert — maak je account aan"
  - Begroeting met naam (optioneel via `templateData`)
  - Korte uitleg: "Je bent toegevoegd aan het BengCert platform, waar audits van energieprestatie-rapporten worden beoordeeld."
  - Stappen om account aan te maken:
    1. Klik op de knop hieronder om naar het platform te gaan
    2. Klik op "Wachtwoord vergeten" en vul je e-mailadres in
    3. Volg de instructies in de mail die je dan ontvangt om een wachtwoord in te stellen
    4. Log in met je e-mailadres en nieuwe wachtwoord
  - Knop: "Ga naar BengCert" → `https://www.bengaudit.nl`
  - Footer: contactinfo Julian (julian@borgch.nl) bij vragen

**2. Registreren in `registry.ts`**
- Importeer template en voeg toe aan `TEMPLATES` map onder key `platform-uitnodiging`
- `previewData`: `{ naam: 'Rob Harbers' }`

**3. Beheer-pagina UI uitbreiden**
- Per medewerker een extra knop "Platform-uitnodiging sturen" (naast bestaande "Opnieuw uitnodigen")
- Of: een aparte sectie in Beheer "Platform-uitnodiging sturen" met invoervelden naam + e-mail + verstuurknop (handig voor mensen die nog géén account hebben in het systeem)
- Aanbeveling: **beide** — knop bij bestaande medewerkers + losse sectie voor nieuwe ontvangers
- Bij verzenden: `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'platform-uitnodiging', recipientEmail, templateData: { naam }, idempotencyKey: ..., cc: 'julian@borgch.nl' } })`

**4. Direct versturen naar Rob Harbers**
- Na deployment: één keer aanroepen voor `info@kampermanadviseurs.nl` met naam "Rob Harbers"
- Julian krijgt automatisch CC

### Te wijzigen / nieuwe bestanden
- **NIEUW**: `supabase/functions/_shared/transactional-email-templates/platform-uitnodiging.tsx`
- **WIJZIG**: `supabase/functions/_shared/transactional-email-templates/registry.ts` (template registreren)
- **WIJZIG**: `src/pages/Beheer.tsx` (nieuwe knop + losse sectie voor uitnodiging)
- **DEPLOY**: `send-transactional-email` edge function herdeployen
- **ACTIE**: Eénmalige call voor Rob Harbers

### Verschil met bestaande mails
| Mail | Trigger | Inhoud |
|---|---|---|
| Auth `invite` (InviteEmail) | `inviteUserByEmail` via Beheer | Magic link naar wachtwoord-aanmaak (1 klik) |
| `notify-adviseur` audit-afgerond | Auditor rondt audit af | "Er is een audit voor jouw project, reageer binnen X dagen" |
| **NIEUW `platform-uitnodiging`** | Handmatig vanuit Beheer | Algemene welkomstmail + uitleg hoe account aanmaken via "wachtwoord vergeten" |

### Waarom "wachtwoord vergeten" i.p.v. magic link?
De magic-link uit `inviteUserByEmail` lijkt voor sommige adviseurs (zoals Rob) niet aan te komen of verloopt voordat ze hem zien. Door ze via "wachtwoord vergeten" te laten gaan, hebben ze altijd zelf controle en kan de flow herhaald worden zonder beheerder-actie.

