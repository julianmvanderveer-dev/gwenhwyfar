

# Testaccounts aanmaken per rol

## Huidige situatie
Er zijn nu 2 gebruikers, beide met meerdere rollen. Om per rol te testen heb je aparte accounts nodig die elk slechts één rol hebben.

## Aanpak

### Stap 1: E-mailbevestiging tijdelijk uitschakelen
Momenteel moet elke nieuwe gebruiker zijn e-mail bevestigen. Dit maakt het lastig om snel testaccounts aan te maken. We schakelen auto-confirm tijdelijk in zodat je direct kunt inloggen na registratie.

### Stap 2: Testaccounts registreren via de app
Je registreert 4 accounts via het registratieformulier op `/login`, bijvoorbeeld:

| Account | E-mail | Rol |
|---|---|---|
| Beheerder | `test-beheer@test.nl` | beheer |
| Tekenaar | `test-tekenaar@test.nl` | tekenaar |
| Auditor | `test-auditor@test.nl` | auditor |
| EP-adviseur | `test-epadviseur@test.nl` | ep_adviseur |

Of gebruik Gmail-aliassen: `jouw+beheer@gmail.com`, `jouw+tekenaar@gmail.com`, etc. — die komen allemaal in dezelfde inbox.

### Stap 3: Rollen toewijzen via Beheer-pagina
Log in met je bestaande beheer-account (`julian@borgch.nl`) en ga naar `/beheer`. Daar vink je per testaccount precies één rol aan.

### Stap 4: EP-adviseur koppelen
Voor het EP-adviseur account moet er ook een record in de `adviseurs`-tabel bestaan met hetzelfde e-mailadres, zodat de automatische koppeling werkt.

### Stap 5: Testen
Log in/uit met elk testaccount en doorloop de workflow.

### Stap 6: Auto-confirm weer uitschakelen
Na het testen zetten we e-mailbevestiging weer aan.

## Technische wijziging
- Authenticatie-instelling: `enable_signup = true`, `enable_confirmations = false` (tijdelijk)
- Geen code-aanpassingen nodig

