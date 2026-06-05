## Probleem

Op de bevinding-reactiepagina (`FindingReactie.tsx`) staat na opslaan van een concept de link **"Naar projectoverzicht om alles te versturen →"**. Die brengt de EP-adviseur naar `ProjectDetail`, waar de volledige checklists getoond worden — verwarrend, want het is onduidelijk wat hij daar moet doen.

In werkelijkheid kan de EP-adviseur uitsluitend per bevinding reageren. De verzendknop ("Alle reacties nu versturen") staat al onderaan dezelfde pagina via `BatchVersturenCompact` zodra alle concepten klaar zijn.

## Voorstel

In `src/pages/FindingReactie.tsx`:

1. **Verwijder** de link "Naar projectoverzicht om alles te versturen →" uit het concept-blokje en uit de keuze-modus.
2. **Pas de tekst in het concept-blokje aan** zodat het niet meer naar het projectoverzicht verwijst, bijv.:
   > "Concept-reactie opgeslagen. Zodra alle reacties in dit project zijn ingevuld, verschijnt onderaan een knop om ze in één keer te versturen."
3. **Voeg een aparte knop "Audit inzien"** toe (naast/boven "Terug") die navigeert naar `/project/{projectId}`. Daarmee is de twee-knoppen-rol duidelijk: reageren = hier op de bevinding, audit bekijken = aparte knop.
4. De bestaande `BatchVersturenCompact` onderaan blijft ongewijzigd — die toont de tellerregel en verzendknop wanneer alle reacties klaar zijn.

## Buiten scope

- Geen wijzigingen aan `ProjectDetail`, batch-logica, of de auditor-zijde.
- Geen navigatie tussen bevindingen onderling (niet gevraagd).
