# Adviseur: Overzicht-tab in bovenbalk + export van afwijkingen

## Probleem
1. De tab "Overzicht" (met top 5 fouten en benchmark) zit als knop óp de pagina zelf. In de donkerblauwe balk staat alleen "Projecten", waardoor het overzicht makkelijk over het hoofd wordt gezien.
2. Op het Overzicht ontbreekt een download van álle eigen afwijkingen inclusief de toelichting/tekst van de auditor.

## Oplossing

### 1. "Overzicht" in de donkerblauwe balk
- `src/components/AppLayout.tsx`: nieuwe menulink **Overzicht** in de balk, alleen zichtbaar als de actieve rol EP-adviseur is (`actsAs("ep_adviseur")`). De link gaat naar `/inbox` met tab-state `overzicht`; de bestaande "Projecten"-link opent de projectentab.
- `src/pages/Inbox.tsx`: de tabbalk (Projecten / Overzicht) wordt gestuurd door de navigatie-state (`location.state.tab`, nu al uitgelezen maar ongebruikt), zodat de balklink direct de juiste tab opent. Paginatitel past mee ("Overzicht" bij die tab).

### 2. Uitdraai van alle afwijkingen op tab Overzicht
- Nieuwe databasefunctie `get_mijn_afwijkingen(_auditjaar text default null)`: geeft voor de ingelogde adviseur (via `adviseurs.user_id = auth.uid()`, dus nooit andermans gegevens) alle zichtbare afwijkingen terug met:
  - projectnaam en auditjaar
  - onderdeel en controlepunt
  - de volledige tekst/toelichting van de afwijking (zoals door de auditor ingevuld)
  - naam van de auditor (via `toegewezen_beoordelaar` → profielnaam)
  - status en datum
  - Alleen blijvende afwijkingen (zelfde definitie als Foutenanalyse: niet_goed, goedgekeurd/gesloten, geen 'vervallen').
- `src/components/dashboard/AdviseurOverzicht.tsx`: knop **"Download alle afwijkingen (CSV)"**, met respect voor het gekozen auditjaar-filter. Nederlandse Excel-vriendelijke CSV (puntkomma, BOM), bestandsnaam bv. `mijn-afwijkingen-2025-2026.csv`.

## Technische details
- Migratie: `CREATE FUNCTION get_mijn_afwijkingen` (security definer, `EXECUTE` aan `authenticated`, zelfde patroon als `get_mijn_fouten_top`/`get_mijn_benchmark`).
- Geen wijzigingen aan RLS-beleid of bestaande exports bij Beheer.
