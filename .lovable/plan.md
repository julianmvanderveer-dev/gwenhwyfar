## Probleem

Wanneer de auditor `upload_vereist` heeft aangezet, verbergt `FindingReactie.tsx` de knop "Accepteren". De EP-adviseur ziet alleen nog "Niet akkoord" als optie, terwijl hij in werkelijkheid wél akkoord kan zijn met de bevinding — hij moet alleen het ontbrekende document aanleveren (bijv. de onderbouwing Rc-waardes). Hij wordt nu gedwongen "Niet akkoord" te selecteren om bij het uploadveld te komen, wat semantisch onjuist is.

## Voorstel

Vervang in `src/pages/FindingReactie.tsx` (modus "keuze") de huidige logica wanneer `upload_vereist` true is:

- Toon naast "Niet akkoord" een tweede knop **"Document aanleveren"** (in plaats van "Accepteren").
- Deze knop opent dezelfde flow als de huidige akkoord-flow, maar met:
  - verplichte file-upload (zelfde 10 MB-limiet, zelfde bucket `finding-documents`)
  - optionele toelichting (textarea, zoals nu bij akkoord)
  - opslag als concept van `type: "akkoord"` met `bijlage_pad` gevuld, zodat het meeloopt in de bestaande batch-verstuur-flow en de auditor het als geaccepteerd-met-bewijs ziet
- "Niet akkoord" blijft bestaan voor het geval de adviseur het écht niet eens is met de bevinding (ook met verplichte upload).
- Knoplabel bij bestaand akkoord-concept: "Wijzig: document aangeleverd".

## Technische details

- Uitbreiden van het concept-schema: `bijlage_pad` toestaan op `type: "akkoord"` (al ondersteund op `niet_akkoord`, dus enkel typings/serialisatie aanpassen).
- `accepteren()` splitsen of uitbreiden met optionele upload (hergebruik bestaande `uploadFile()`).
- Disable-conditie op verzendknop: bij `upload_vereist` is bestand verplicht voor zowel akkoord als niet-akkoord.
- Berichtweergave aanpassen: bij akkoord-concept met bijlage een download-link tonen in het concept-blokje (consistent met `messages`).
- Geen DB/RLS-wijzigingen nodig; `concept_reactie` is een `jsonb`.
- Geen wijzigingen aan de auditor-zijde (`FindingBeoordeling`) — die toont al bijlagen bij berichten zodra de batch verstuurd is.

## Buiten scope

- Wijzigingen in batch-verstuur-logica of e-mailtemplates.
- Wijzigingen aan de upload-vereist-instelling zelf in de auditor-UI.
