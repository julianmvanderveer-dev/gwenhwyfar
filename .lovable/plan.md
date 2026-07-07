# Bulk-export auditrapporten (PDF in ZIP)

Nu wordt per project één PDF gemaakt via de printknop op de projectpagina (`window.print()` op de HTML uit `generateAuditReport.ts`). Voor een bulkexport doen we hetzelfde renderproces, maar geautomatiseerd voor alle projecten tegelijk, en bundelen we het resultaat als ZIP-download.

## Wat je krijgt
- Nieuwe knop **"Alle auditrapporten downloaden (ZIP)"** in Beheer → sectie Projecten exporteren.
- Filter: **alle projecten** of alleen **afgeronde projecten** (status `afgerond` of `gesloten`) — met een selectievak. Default = afgerond, omdat lopende projecten nog geen zinvol rapport hebben.
- Optioneel jaarfilter (hergebruik bestaande jaar/datum-filter uit `ProjectenExport.tsx`) op `gearchiveerd_op` / `datum_aangemaakt`.
- Voortgangsindicator ("PDF 12 van 87 gegenereerd…") en toast als klaar.
- Downloadbestand: `auditrapporten-<jaar>-<datum>.zip`. Binnen de ZIP één PDF per project met naam `1{nr adviseur} {adviseur} {projectnaam}.pdf` (zelfde titelconventie als de bestaande single-export).

## Aanpak (technisch)

1. **Data ophalen (parallel per project, gebatched):** per project alle data die `generateAuditReport()` nodig heeft:
   - project (incl. adviseur_id, ep2-velden, status)
   - findings (met `zichtbaar_voor_adviseur=true`)
   - messages van findings (voor "Afwijking geaccepteerd" detectie)
   - adviseur (naam, nummer, user_id)
   - checklist_templates voor de audit_categorie (gecacht per categorie)
   - project_uitdraai.extracted_data (indien aanwezig)
   - logo uit `app_settings` (1 keer ophalen, hergebruik voor alle)

   Batches van 5 projecten tegelijk om DB niet te overladen.

2. **HTML → PDF client-side:** installeer `html2pdf.js` (wrapper om `html2canvas` + `jspdf`). Per project: HTML uit `generateAuditReport()` in een off-screen `<iframe>` renderen op A4-landscape formaat, `html2pdf` roept het om naar een `Blob`.

3. **Bundelen:** met `jszip` (al bruikbaar via npm) alle PDF-blobs samenvoegen en via `file-saver` (of bestaande `downloadCsv`-patroon met blob-URL) downloaden.

4. **Foutafhandeling:** als één project faalt (bijv. geen templates), sla die over, log naar console, en zet in de ZIP een `_fouten.txt` met de lijst overgeslagen projecten + reden. Rest wordt gewoon geëxporteerd.

## Files

- **Nieuw:** `src/components/projecten/BulkPdfExport.tsx` — component met filter, knop, voortgangsbalk en export-logica.
- **Nieuw:** `src/lib/renderReportToPdf.ts` — hulpfunctie die HTML-string → PDF-blob converteert via html2pdf.js in verborgen iframe.
- **Wijzigen:** `src/pages/Beheer.tsx` — plaats `<BulkPdfExport />` onder de bestaande `ProjectenExport`.
- **Dependencies toevoegen:** `html2pdf.js`, `jszip`, `file-saver` (+ types).
- **Geen wijzigingen** aan `generateAuditReport.ts`, DB-schema, RLS, edge functions of e-mail.

## Verwachtingen bij de gebruiker
- PDF-generatie in de browser duurt merkbaar (~1–3 sec per rapport). 100 rapporten ≈ 2–5 min. Voortgang wordt getoond.
- Tabblad open laten tijdens export.
- Rapporten zijn identiek aan wat je nu via de printknop op één project krijgt (zelfde huisstijl, samenvatting, afwijkingenblok, EP2-blok, tabellen per onderdeel).

## Buiten scope
- Geen server-side PDF-generatie (edge function met headless Chrome) — client-side volstaat en vermijdt extra infra.
- Geen wijziging aan het rapport zelf.
- Geen wijziging aan de opmerking-issue uit het vorige gesprek.
