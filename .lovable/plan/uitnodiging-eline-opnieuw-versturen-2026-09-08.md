# Uitnodiging Eline opnieuw versturen

## Huidige situatie
- Account voor eline@borgch.nl (Eline van Dam) bestaat al sinds vanmorgen 07:28, maar de uitnodiging is nog niet bevestigd en ze is nog nooit ingelogd.
- Er is daarom ook nog géén wachtwoord gezet. Inloggen met eline@borgch.nl + "Oranjelaan3G!" werkt niet — dat wachtwoord is nooit vastgelegd.

## Uit te voeren
1. De uitnodigingsmail opnieuw versturen (via de bestaande "resend invite"-actie van het platform, dezelfde als de knop bij Beheer → Projectteam).
2. Eline klikt op de link in die mail en kiest daarbij zélf haar wachtwoord.
3. Daarna logt ze in op www.bengaudit.nl met eline@borgch.nl en het door haar zelf gekozen wachtwoord.

Wil je dat ze als wachtwoord "Oranjelaan3G!" gebruikt? Dan kan ze dat zelf invullen bij het accepteren van de uitnodiging — ik kan dat niet vooraf instellen bij een uitnodiging.

## Technische details
- Call naar edge function `create-team-member` met `{ resend_invite: true, email: "eline@borgch.nl", naam: "Eline van Dam" }` (vereist beheerdersessie; de huidige preview-sessie van Julian heeft de beheer-rol).
- Geen code- of database-wijzigingen nodig.
