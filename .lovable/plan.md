## Doel
Zodra auditor/tekenaar een controlepunt op **Goed** zet, krijgt dat controlepunt automatisch status **`gesloten`** in plaats van `open`. Geldt zowel voor losse beoordelingen als de bulk-knop "Alles goedkeuren".

## Wijzigingen

### 1. `src/pages/ProjectDetail.tsx` — `updateBeoordeling` (rond regel 275)
Status meesturen op basis van beoordeling:
- `beoordeling = "goed"` → `status: "gesloten"`
- `beoordeling = "niet_goed"` of `"opmerking"` → `status: "open"` (terugzetten als het eerder gesloten was)

### 2. `src/pages/ProjectDetail.tsx` — beoordeling wissen (rond regel 305)
Bij `beoordeling = null` (geen beoordeling): status terug naar `"open"`, zodat een teruggedraaide goedkeuring niet als gesloten blijft staan.

### 3. `src/pages/ProjectDetail.tsx` — `allesGoedkeuren` (rond regel 333)
Bij de bulk-update ook `status: "gesloten"` meesturen samen met `beoordeling: "goed"`.

### 4. Veiligheid: alleen overschrijven wanneer veilig
Status mag NIET worden overschreven als het controlepunt al in een eindstatus zit die de adviseur-flow betreft (`reactie_goedgekeurd`, `gesloten` na adviseur-reactie, of `reactie_ontvangen`). In de praktijk: status alleen op `gesloten` zetten als de huidige status `open` is en het controlepunt **niet** `zichtbaar_voor_adviseur = true` is (= nog niet de reactie-cyclus in gegaan). Voor een bevinding die wel al naar de adviseur is gegaan blijft de bestaande logica gelden — daar wordt 'Goed' niet gebruikt om af te sluiten.

## Geen wijzigingen nodig
- `useBatchVersturen.ts`: filtert al op `zichtbaar_voor_adviseur && status === "open"`. 'Goed'-bevindingen zijn niet zichtbaar voor adviseur, dus geen impact.
- `generateAuditReport.ts`: gebruikt `status === "gesloten"` al als afgesloten-indicator; dit blijft consistent.
- Geen migratie nodig: bestaande 'goed'-rijen met status `open` blijven correct werken (ze worden toch niet meegenomen in de adviseur-flow). Optioneel: éénmalige data-fix kan later, niet noodzakelijk.

## Samenvatting in 1 zin
`updateBeoordeling` en `allesGoedkeuren` zetten de finding-status op `gesloten` bij 'Goed' en op `open` bij 'Niet goed' / 'Opmerking' / leeg, mits de bevinding nog niet in de adviseur-cyclus zit.