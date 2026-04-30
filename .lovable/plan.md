## Doel
Het downloadbare auditrapport (`src/lib/generateAuditReport.ts`) op drie punten verbeteren:

### 1. Bestandsnaam / titel
- Aanroep in `ProjectDetail.tsx` haalt nu alleen `naam` van de adviseur op. Uitbreiden zodat ook `nummer` wordt opgehaald.
- Nummer wordt 3-cijferig zero-padded (consistent met de rest van de app, bv. `007`).
- Het rapport wordt via `window.open` + `window.print()` gegenereerd. Browsers gebruiken de `<title>` als standaard PDF-bestandsnaam.
- Nieuwe `<title>` (en daarmee voorgestelde bestandsnaam):
  `007 Jan Jansen 7108AA12 EPW-B`
  Opbouw: `{adviseurNummer} {adviseurNaam} {projectnaam} {audit_categorie}`.
- Indien geen adviseur gekoppeld: alleen `{projectnaam} {audit_categorie}` als titel, zonder lege ruimtes ervoor.

### 2. Openstaande afwijkingen bovenaan
- Bovenaan het rapport (direct onder de header/projectinfo, vóór EP2 en samenvatting) een nieuwe sectie **"Openstaande afwijkingen"**.
- Definitie "blijven staan / niet afdoende weerlegd":
  - `beoordeling = 'niet_goed'`
  - `status NIET in ('reactie_goedgekeurd', 'gesloten')`
  - alleen bevindingen die zichtbaar zijn voor de adviseur (`zichtbaar_voor_adviseur = true`)
- Weergave als compacte tabel met: Code, Onderdeel, Controlepunt, Toelichting, Status.
- Visueel benadrukt (rode rand/achtergrond) zodat het in één oogopslag duidelijk is.
- Als er geen openstaande afwijkingen zijn: blok met groene melding "Geen openstaande afwijkingen".
- De volledige checklist per onderdeel blijft daaronder gewoon staan (ongewijzigd).

### 3. Logo BengCert bovenaan
- In de header van het rapport (linksboven) het BengCert-logo tonen.
- Bron:
  - primair: `app_settings.org_logo_url` (indien gevuld) — al opgehaald via `useAppSettings`.
  - fallback: ingebouwde inline SVG (zelfde tekening als `src/components/BengCertLogo.tsx`, geschikt voor printen).
- Het logo wordt links naast de titel "Auditrapport" geplaatst, met de projectnaam eronder.

## Wijzigingen per bestand

- `src/lib/generateAuditReport.ts`
  - `ReportData` uitbreiden met `adviseurNummer?: number` en `logoUrl?: string`.
  - `<title>` opbouwen volgens nieuwe formule.
  - Nieuwe HTML-sectie "Openstaande afwijkingen" bovenaan, direct onder de header.
  - Header herontwerpen met logo links (img-tag voor `logoUrl`, anders inline SVG).

- `src/pages/ProjectDetail.tsx` (rond regel 580–600)
  - Bij ophalen adviseur ook `nummer` selecteren.
  - `useAppSettings()` gebruiken om `org_logo_url` mee te geven.
  - Beide doorgeven aan `generateAuditReport`.

## Geen wijzigingen
- Datamodel, RLS, edge functions: niets te wijzigen.
- Andere weergaven (inbox, dashboard, projectdetail-UI) blijven ongewijzigd.

## Verificatie
- Rapport genereren voor een afgerond project met openstaande niet-goed bevindingen → bovenaan rode tabel zichtbaar.
- Rapport voor project zonder openstaande afwijkingen → groene "alles in orde" melding.
- Bestandsnaamvoorstel in print-dialog komt overeen met `{nr} {naam} {projectnaam} {categorie}`.
- Logo zichtbaar zowel met als zonder `org_logo_url` (fallback SVG).