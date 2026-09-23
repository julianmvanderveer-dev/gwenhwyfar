# Eigen foutenoverzicht voor de EP-adviseur

De EP-adviseur krijgt op zijn eigen startscherm een beknopt overzicht van zijn meest voorkomende afwijkingen — alleen zijn eigen resultaten, niemand anders ziet die van hem.

## Wat de adviseur ziet

Een compact kaartje boven zijn afwijkingenoverzicht: **Mijn meest voorkomende aandachtspunten**.

- Standaard de **top 5**, met een knop "Toon top 10".
- Per regel: onderdeel, controlepunt en hoe vaak het voorkwam (bijv. "7×").
- Filter op auditjaar (standaard: alle jaren).
- Onder de lijst: het totaal aantal blijvende afwijkingen en het aantal audits waarop dit gebaseerd is.
- Heeft de adviseur nog geen blijvende afwijkingen, dan verschijnt een korte, positieve melding in plaats van een lege tabel.

Geteld worden dezelfde afwijkingen als in de Foutenanalyse bij Beheer: afwijkingen die definitief zijn blijven staan. Vervallen afwijkingen en afwijkingen die nog in behandeling zijn, tellen niet mee. Zo komen de cijfers van de adviseur exact overeen met wat bij Beheer gedownload wordt.

## Technische uitwerking

**Database**
- Nieuwe security-definer functie `get_mijn_fouten_top(_auditjaar text default null, _limit int default 10)`:
  - bepaalt het adviseursrecord via `adviseurs.user_id = auth.uid()` (geen parameter, dus niemand kan andermans cijfers opvragen);
  - telt `findings` met `beoordeling = 'niet_goed'` en `status in ('reactie_goedgekeurd','gesloten')`, waarbij `concept_reactie->>'type'` leeg is of `'akkoord'` (zelfde definitie als `FoutenAnalyse.tsx`);
  - filtert optioneel op auditjaar via `projects.auditjaar`, met terugval op de aanmaakdatum (1 juli t/m 30 juni);
  - geeft terug: `onderdeel`, `controlepunt`, `aantal`, plus via een tweede functie of extra kolommen het totaal en aantal projecten;
  - `EXECUTE` alleen aan `authenticated`.

**Frontend**
- Nieuw component `src/components/dashboard/MijnFoutenTop.tsx` met de auditjaar-select, top 5/10-schakelaar en tabel in dezelfde stijl als `AandachtspuntenAdviseur.tsx`.
- Gerenderd in `src/pages/Inbox.tsx` boven `AdviseurSectie`, alleen wanneer de actieve rol EP-adviseur is.
- Geen CSV-download voor de adviseur; exports blijven bij Beheer.
