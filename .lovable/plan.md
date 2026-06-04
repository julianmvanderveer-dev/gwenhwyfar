## Probleem

Egon krijgt op `/inbox` een witte pagina met:
`NotFoundError: Het uitvoeren van 'removeChild' op 'Node' is mislukt...`

Dit is een bekende React-crash die optreedt wanneer de **browser de pagina automatisch vertaalt** (Chrome Translate). De vertaler vervangt tekstnodes in de DOM; React kent die nieuwe nodes niet en crasht zodra hij iets probeert te verwijderen of opnieuw te renderen (bv. bij het laden van de Inbox-tabellen).

Oorzaak in dit project: `index.html` staat op `<html lang="en">`, terwijl de hele app in het Nederlands is. Chrome detecteert de taalmismatch en biedt (of voert automatisch uit) een vertaling NL→EN aan. Bij Egon staat dit kennelijk aan.

## Oplossing (alleen `index.html`)

1. `<html lang="en">` → `<html lang="nl" translate="no">`
2. In `<head>` toevoegen:
   - `<meta name="google" content="notranslate" />`
3. `<body>` → `<body class="notranslate">`

Dit vertelt Chrome/Edge/Safari expliciet om de pagina **niet** te vertalen, waardoor de DOM stabiel blijft en de removeChild-crash verdwijnt — voor Egon en voor iedereen die in de browser auto-translate aan heeft staan.

## Scope

- Alleen `index.html` wordt aangepast.
- Geen wijzigingen aan componenten, routing of data.
- Egon hoeft daarna alleen één keer te verversen (en eventueel "Origineel tonen" in de Chrome-vertaalbalk te kiezen als hij eerder al vertaald had).
