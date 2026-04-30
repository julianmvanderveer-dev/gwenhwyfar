## Probleem
Het tabblad **Bevindingen** in het Auditor-/Tekenaardashboard toont nu één platte lijst van losse bevindingen door alle projecten heen. Bij meerdere openstaande reacties per project verlies je het overzicht — je weet niet meer welke bevindingen bij elkaar horen, en de batch-flow ("eerst alles beoordelen, dan in één keer versturen") sluit daar slecht op aan.

## Oplossing
Hergroepeer de **Bevindingen**-tab per **project**. Eén regel per project, uitklapbaar naar de bijbehorende reacties. De auditor klikt eerst op een project, ziet daarbinnen alle te beoordelen reacties netjes onder elkaar, en kan vandaaruit doorklikken naar de individuele bevinding óf direct naar het projectoverzicht voor de batchverzending.

## Wijzigingen

### 1. Groeperen per project in `MedewerkerDashboard.tsx`
- Bestaande platte `findings`-lijst groeperen op `project_id`.
- Per project één rij tonen met:
  - Projectnaam (link naar `/project/:id`)
  - EP-adviseur
  - **Aantal te beoordelen reacties** (badge, bv. `2` of `2 — 1 concept klaar`)
  - **Voortgangsindicator concept** (bijv. `1/2 beoordeeld`) — gebruikt dezelfde logica als `BatchVersturenCompact`
  - Datum oudste / nieuwste reactie
  - Knop **"Beoordelen"** → opent uitklap

### 2. Uitklapbare detailrijen per bevinding
- Bij uitklappen verschijnt onder de projectregel een compacte sublijst met alle openstaande reacties van dat project:
  - Onderdeel + controlepunt
  - Korte preview van de adviseur-reactie (zoals nu)
  - Status-badge: **"Nog beoordelen"** of **"Concept klaar"** (akkoord/niet akkoord)
  - Datum
  - Link **"Open"** → `/finding/:id/beoordeling`
- Standaard ingeklapt; project met maar 1 bevinding mag eventueel auto-uitklappen of direct naar `/finding/:id/beoordeling` doorlinken.

### 3. Snelle route naar batchverzenden
Onderin de uitgeklapte sectie een knop **"Naar projectoverzicht"** → `/project/:id`, waar de bestaande `BatchVersturen`-balk staat zodra alle concepten klaar zijn. Geen losse verzendknop in deze tab; dat blijft consistent met de nieuwe batch-architectuur.

### 4. Lege-staat & teller
- Tabnaam-badge toont niet langer het aantal losse bevindingen, maar het **aantal projecten met openstaande reacties** (bv. `2 projecten`).
- Lege staat blijft hetzelfde.

### 5. Kleine UI-bouwstenen
- Gebruik `Collapsible` van shadcn (al in project) voor de uitklap.
- Hergebruik `useBatchVersturen` of een lichte variant voor de `concept klaar`-telling per project, zodat de logica niet dubbel staat.

## Wat NIET verandert
- De Mijn projecten-tab blijft ongewijzigd.
- De individuele bevinding-pagina (`FindingBeoordeling.tsx`) blijft hetzelfde, inclusief de compacte batchbalk.
- De batch-architectuur en de databasestatussen blijven ongewijzigd — geen migraties nodig.
- De adviseur-zijde (Inbox-tab voor EP-adviseur) wijzigt in deze stap niet; ik kan dezelfde grouping later op die tab toepassen als je dat ook wenst.

## Resultaat
De auditor opent **Bevindingen** en ziet bovenaan compact: *"Project 7108AA107C — 2 reacties te beoordelen — 1/2 concept klaar"*. Eén klik klapt het project open en toont de twee reacties netjes onder elkaar. Vanaf daar doorklikken naar de finding of naar het projectoverzicht om alles in één keer te versturen.

## Technische details
- Wijziging beperkt tot:
  - `src/components/dashboard/MedewerkerDashboard.tsx` (groeperen + uitklap)
  - mogelijk een kleine helper in `src/hooks/useBatchVersturen.ts` om concept-tellingen te delen
- Geen DB-migratie, geen RLS-wijziging, geen edge-functie wijziging.