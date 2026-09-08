# Uitnodigingsmail Eline komt niet aan

## Wat ik zie

- Het account eline@borgch.nl bestaat en is inmiddels bevestigd; er is vanmorgen ook al een keer ingelogd.
- Van de uitnodigingsmail is nergens een verzendregistratie te vinden — die mail is dus niet daadwerkelijk de deur uit gegaan.
- Oorzaak: de mails die bij aanmelden/bevestigen/wachtwoord-vergeten horen lopen via het e-maildomein `bengcert.bengaudit.nl`, en de verificatie daarvan is mislukt ("timed out", de vereiste records staan niet goed bij de domeinprovider). De gewone platformmails (auditrapport, herinneringen) gaan wél gewoon uit — die lopen via een andere route.

## Aanpak

### 1. Eline nu direct toegang geven (geen bevestigingsmail nodig)
- Haar account krijgt een standaardwachtwoord (`BengCert26`) ingesteld.
- Ze krijgt de bestaande welkomstmail "Platform-uitnodiging" met de inlogstappen — die route werkt aantoonbaar wel.
- Ze logt in op www.bengaudit.nl en wijzigt daarna zelf haar wachtwoord.

### 2. Structureel: e-maildomein herstellen
De verificatie van `bengcert.bengaudit.nl` moet alsnog worden afgerond, anders blijven bevestigings- en wachtwoord-vergeten-mails uit. Bij de domeinprovider van bengaudit.nl moeten deze records staan:

```text
TXT   _lovable-email.bengaudit.nl   lovable_email_verify=54988e24c4c0840538a7551fbacfcec83c7ff280b7fe42f474a52746010f7d0f
NS    bengcert.bengaudit.nl         ns3.lovable.cloud
NS    bengcert.bengaudit.nl         ns4.lovable.cloud
```

Zodra die kloppen, opnieuw verifiëren via Instellingen → E-mail. Dit is de enige stap waarvoor jij (of de beheerder van het domein) actie moet ondernemen.

### 3. Uitnodigen betrouwbaar maken
Bij Beheer → Projectteam wordt de knop "Uitnodiging opnieuw versturen" omgezet naar dezelfde werkende welkomstmail-route (account + standaardwachtwoord + welkomstmail), zodat nieuwe medewerkers niet afhankelijk zijn van de bevestigingsmail. Zodra het domein is hersteld kan dit desgewenst weer terug.

## Technisch

- `auth-email-hook` gebruikt nog de oude directe verzendmethode via `@lovable.dev/email-js`; die faalt stil zolang het domein niet actief is. Bij het herstel wordt deze hook meteen naar de wachtrij-variant (`enqueue_email`) gebracht, zodat mislukte auth-mails zichtbaar worden in het verzendlog.
- `create-team-member` → `resend_invite` roept `inviteUserByEmail` aan; deze tak wordt vervangen door de bestaande `create_adviseur_account` + `send-transactional-email` (`platform-uitnodiging`) flow die `Beheer.tsx` al gebruikt.
