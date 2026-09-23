# Tab "Overzicht" voor de EP-adviseur

## Wat de adviseur straks ziet

De adviseurspagina krijgt twee tabbladen:

- **Projecten** — precies zoals nu: openstaande punten en reacties.
- **Overzicht** — een rustige samenvatting van de eigen prestaties.

Het blok met de top 5 fouten verdwijnt van het projectenscherm en verhuist naar Overzicht.

## Inhoud van het tabblad Overzicht

1. **Kerncijfers** (vier kaartjes, filterbaar op auditjaar)
   - Aantal geauditeerde projecten
   - Aantal afwijkingen dat is blijven staan
   - Gemiddeld aantal afwijkingen per project
   - Percentage audits zonder blijvende afwijking

2. **Mijn meest voorkomende afwijkingen** — de bestaande top 5 (uitklapbaar naar top 10), met onderdeel, controlepunt en aantal.

3. **Benchmark (anoniem)**
   - Naast elk eigen kerncijfer het **gemiddelde van alle adviseurs** in hetzelfde auditjaar, plus de positie in de vorm van een percentiel ("je scoort beter dan 70% van de adviseurs").
   - Een balkje dat jouw score afzet tegen het gemiddelde en de beste 25%.
   - Bij de top-5-lijst per punt: hoe vaak dit punt gemiddeld bij andere adviseurs voorkomt, zodat zichtbaar wordt of het een persoonlijk of een breed probleem is.
   - Volledig anoniem: geen namen, geen aantallen per andere adviseur, en de benchmark verschijnt alleen als er minimaal 5 adviseurs met audits in dat auditjaar zijn (anders "te weinig gegevens voor een betrouwbare vergelijking").

## Technische uitwerking

- `src/pages/Inbox.tsx`: `adviseurContent` wordt een `Tabs` met `Projecten` (huidige `AdviseurSectie`) en `Overzicht` (nieuw `AdviseurOverzicht`). `MijnFoutenTop` niet langer boven de projectenlijst.
- Nieuw component `src/components/dashboard/AdviseurOverzicht.tsx`: auditjaar-select, kerncijferkaarten, benchmarkbalken en de bestaande `MijnFoutenTop` (aangepast zodat het auditjaarfilter van boven wordt doorgegeven).
- Nieuwe security-definer RPC `get_mijn_benchmark(_auditjaar text default null)` die uitsluitend geaggregeerde cijfers teruggeeft: eigen kerncijfers (bepaald via `adviseurs.user_id = auth.uid()`, geen parameter), het gemiddelde en de mediaan over alle adviseurs, het 25e-percentiel en het eigen percentiel, plus het aantal meegetelde adviseurs. Geeft benchmarkvelden `null` terug bij minder dan 5 adviseurs. `EXECUTE` alleen voor `authenticated`.
- `get_mijn_fouten_top` wordt uitgebreid met een extra kolom `gemiddeld_bij_anderen` (gemiddeld aantal per adviseur voor hetzelfde controlepunt), zonder herleidbare gegevens.
- Telling identiek aan de bestaande foutenanalyse: `findings` met `beoordeling = 'niet_goed'`, status `reactie_goedgekeurd`/`gesloten`, vervallen afwijkingen niet meegeteld; auditjaar uit `projects.auditjaar` met terugval op `datum_aangemaakt`.
