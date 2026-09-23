# Screenshot plakken als bewijs bij reactie

## Doel
Naast het kiezen van een bestand kan een EP-adviseur (of auditor) een screenshot direct in het reactiescherm plakken (Ctrl+V) als bewijs. Dit telt net zo goed als een upload, ook wanneer de beoordelaar een upload verplicht heeft gesteld.

## Wijzigingen

### src/pages/FindingReactie.tsx
- Paste-handler op het reactiegedeelte: bij Ctrl+V wordt gekeken of het klembord een afbeelding bevat. Zo ja, dan wordt die omgezet naar een PNG-bestand en gebruikt als bijlage (dezelfde variabele als bij "Document bijvoegen").
- Er verschijnt direct een miniatuurvoorbeeld van de geplakte afbeelding met een verwijder-kruisje, zodat duidelijk is dat de bijlage is vastgelegd.
- Bestandseigenschappen: automatische naam zoals `screenshot-2026-09-23-1447.png`, limiet 10 MB.
- Een geplakte screenshot voldoet aan de verplichte-upload-controle: de knoppen "Reactie opslaan" worden dus actief zodra er een bestand gekozen óf een screenshot geplakt is.
- Korte hulptekst bij het uploadveld: "U kunt ook een screenshot plakken (Ctrl+V) in dit vlak."
- Werkt op alle drie de plekken in dit scherm waar een bijlage kan (acceptatie, gewone reactie, aanvulling op verzoek auditor).

## Technisch
- Geen database- of opslagwijziging nodig: `messages.bijlage_pad` en de bucket `finding-documents` accepteren PNG al (`.png` staat al in de accept-lijst).
- Afbeeldingen uit het klembord worden als PNG geüpload via de bestaande upload-route, dus downloaden en weergave in beoordeling werken ongewijzigd.
- Alleen afbeeldingen uit het klembord worden verwerkt; gewone tekst plakken in het berichtveld blijft werken zoals nu.
