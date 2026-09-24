# Per-fase-export ("Projecten exporteren") verwijderen

## Wat
Op de Exports-tab van het beheerscherm staat een tweede kaart met de titel
"Projecten exporteren" (`ProjectenExport.tsx`): per projectfase één downloadknop
(Nog te starten, Deel 1 bezig, Deel 1 afgerond, Deel 2 bezig, Wacht op reactie,
Wacht op nieuwe afmelding, Afgerond). Julian ervaart deze als dubbel, omdat de
eerste kaart "Alle projecten exporteren" via het statusfilter dezelfde selecties
mogelijk maakt. De kaart wordt daarom verwijderd.

## Wijzigingen

### 1. `src/pages/Inbox.tsx` (Exports-tab)
- Verwijder de import van `ProjectenExport` (regel 20).
- Verwijder `<ProjectenExport />` uit de `TabsContent value="exports"` (regel 521).
- Pas de inleidende tekst aan: van "Drie soorten downloads … Per fase …" naar
  "Twee soorten downloads: **Alle projecten** voor één CSV met eigen filters, en
  **Bulk PDF** voor de volledige auditformulieren als PDF in één ZIP-bestand."

### 2. `src/components/projecten/ProjectenExport.tsx`
- Bestand verwijderen; het wordt nergens anders gebruikt (alleen Inbox.tsx importeert
  het). Eventueel controle op ontbrekende andere imports wordt vooraf uitgevoerd.

## Blijft staan
- `AlleProjectenExport.tsx` — filters op auditjaar, audittype, adviseur, status en
  datumbereik blijven beschikbaar; één CSV met alle kolommen inclusief de nieuwe
  kolom "Deel 1 uitgevoerd door".
- `BulkPdfExport.tsx` — ZIP met PDF's.

## Controle na aanpassing
- Build controleert op wees-importen en typefouten.
- Visuele controle dat de Exports-tab nog twee kaarten toont met de juiste tekst.
