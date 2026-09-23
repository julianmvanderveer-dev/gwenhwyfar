# Auditjaren (1 juli t/m 30 juni)

## Doel
Elke audit krijgt een auditjaar zoals "2025-2026". Het juiste auditjaar wordt automatisch voorgesteld op basis van de datum (1 juli t/m 30 juni), maar blijft altijd handmatig aanpasbaar — bijvoorbeeld in juli/augustus wanneer nog audits van het vorige auditjaar worden gedaan.

## Wat er komt

1. **Auditjaar bij het aanmaken van een audit**
   - Nieuw keuzeveld "Auditjaar" op het aanmaakformulier.
   - Standaard staat het juiste auditjaar al ingevuld (op basis van vandaag).
   - Keuzelijst met het vorige, huidige en volgende auditjaar, zodat afwijken makkelijk is.

2. **Auditjaar aanpasbaar bij een bestaande audit**
   - In de kop van het projectscherm is het auditjaar zichtbaar en door beheer/auditor te wijzigen.

3. **Filteren op auditjaar**
   - In de exports bij Beheer, in "Mijn afgeronde audits" en in de Foutenanalyse komt een filter op auditjaar naast/in plaats van het huidige kalenderjaarfilter.
   - Het auditjaar wordt als kolom meegenomen in de CSV-exports.

4. **Bestaande audits**
   - Alle bestaande audits krijgen eenmalig een auditjaar toegekend, afgeleid van hun aanmaakdatum volgens de 1 juli-regel. Achteraf te corrigeren waar nodig.

## Technisch

- Migratie: kolom `auditjaar text` op `projects`, met check op formaat `YYYY-YYYY`; backfill via `datum_aangemaakt` (maand >= 7 → `jaar-jaar+1`, anders `jaar-1-jaar`); index op `auditjaar`. Bestaande RLS/grants ongewijzigd.
- Helper `src/lib/auditjaar.ts`: `huidigAuditjaar(date)`, `auditjaarVanDatum(date)`, `auditjaarOpties(date)` (vorige/huidige/volgende).
- `ProjectAanmaken.tsx`: select met default `huidigAuditjaar(new Date())`, meesturen in de insert.
- `ProjectDetail.tsx`: auditjaar in de header, bewerkbaar voor beheer/auditor, update op `projects`.
- Filters + CSV-kolom in `ProjectenExport.tsx`, `ExportFilter.tsx`, `AfgerondeAudits.tsx`, `FoutenAnalyse.tsx`; bestaande datumfilters blijven werken.
