# EP-adviseur van een project kunnen wijzigen

## Doel
Bij een project moet de gekoppelde EP-adviseur gewijzigd kunnen worden (nu kan hij alleen losgekoppeld worden). Daarnaast eenmalig: project `2142GM_17` koppelen aan Wilco Blankenstijn (adviseurnr. 100).

## Huidige situatie (gecontroleerd)
- Het blok "Stand van zaken" op de projectdetailpagina toont de EP-adviseur met alleen een prullenbak-knop (loskoppelen), zichtbaar voor beheer.
- Project `2142GM_17` heeft nu geen EP-adviseur gekoppeld (leeg veld).
- Wilco Blankenstijn bestaat als actieve EP-adviseur (nr. 100).

## Wat er komt

### 1. EP-adviseur wijzigen in het project
In het "Stand van zaken"-blok wordt de EP-adviseur-regel uitgebreid met een potlood-knop (wijzigen) naast de bestaande prullenbak:
- Klikken opent een keuzelijst met alle actieve EP-adviseurs, gesorteerd op nummer, weergegeven als `100 - Wilco Blankenstijn`.
- Kiezen + bevestigen slaat de nieuwe koppeling op en het scherm toont direct de nieuwe naam.
- Werkt ook als er nog géén adviseur gekoppeld is (dan heet de knop "EP-adviseur koppelen").
- Beschikbaar voor beheer, auditor en tekenaar (dezelfde groep die het project mag beheren); EP-adviseurs zelf kunnen dit niet.
- Bevestigingsstap voorkomt per ongeluk wisselen; melding bevestigt de wijziging.

### 2. Eenmalige toewijzing
Project `2142GM_17` wordt direct gekoppeld aan Wilco Blankenstijn.

## Technisch
- Aanpassing in `src/components/projecten/BeheerStandVanZaken.tsx`: state voor bewerkmodus, laden van `adviseurs` (actief, op nummer), `update({ adviseur_id })` op `projects`, lokale naam bijwerken.
- Rolcheck via bestaande `hasRole` (`beheer`/`auditor`/`tekenaar`).
- Eenmalige data-update via een directe update op de projects-rij (geen schemawijziging nodig).
