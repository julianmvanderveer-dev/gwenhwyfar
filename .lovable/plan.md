# Fix: bulk-PDFs zijn leeg (3 KB)

## Diagnose
De 3 KB duidt op een lege pagina met alleen jsPDF-metadata — html2canvas heeft niets kunnen "fotograferen" en/of de output-chain retourneerde geen blob.

Twee waarschijnlijke oorzaken in `src/lib/renderReportToPdf.ts`:

1. **`.outputPdf('blob')` na `.set(...)` retourneert soms niets** in html2pdf.js. De betrouwbare vorm is `.set(opts).from(el).toPdf().output('blob')` (of `await worker` en dan `worker.output(...)`).
2. **Container ver buiten viewport** (`left:-10000px`) — html2canvas rendert nog wel, maar in combinatie met een direct `from(container)` zonder dat de layout een frame gehad heeft, kan `getBoundingClientRect()` 0×0 zijn. Ook mist het element expliciete achtergrondkleur/padding, waardoor sommige stijlen (bijv. tabellen met `background`) niet worden meegenomen.

## Fix

Vervang de render-helper door een robuustere variant:

- Container plaatsen op `position:fixed; left:0; top:0; width:297mm;` met `opacity:0; pointer-events:none; z-index:-1;` — nog steeds "onzichtbaar" voor de gebruiker maar wel binnen viewport zodat html2canvas geldige coördinaten krijgt.
- Eén `requestAnimationFrame` (of `await new Promise(r => setTimeout(r, 50))`) wachten zodat fonts/layout klaar zijn voor capture.
- Chain omzetten naar: `const worker = html2pdf().set(opts).from(container).toPdf(); await worker; const blob = worker.output('blob');` — deze vorm werkt betrouwbaar in html2pdf.js 0.10+.
- `html2canvas.windowWidth: 1200` toevoegen zodat de canvas een deterministische breedte gebruikt.

Als de test daarna nog steeds leeg oplevert, val terug op alternatief:
- Serialiseer HTML → data-URL → open verborgen `<iframe>` → wacht `load` → `html2pdf` op `iframe.contentDocument.body`. Iframes isoleren stijlen en zijn immuun voor host-CSS die per ongeluk zaken verbergt.

## Files
- **Wijzigen:** `src/lib/renderReportToPdf.ts` — bovengenoemde chain + container-styling + wacht-frame. Geen wijziging aan `BulkPdfExport.tsx` of `generateAuditReport.ts`.

## Verificatie
Na de fix zelf één bulk-export draaien (bijv. filter "afgerond", verwacht een aantal projecten). Openen van één PDF uit de ZIP moet het volledige rapport laten zien (header met logo, samenvatting, afwijkingenblok, tabellen per onderdeel) — vergelijkbaar met de single-project "Download rapport"-knop.
