## Doel
- De downloadbare PDF-rapporten vermelden in de bestandsnaam het auditsoort: **Projectaudit** of **Dossieraudit**.
- Het adviseursnummer in de bestandsnaam bestaat uit exact drie cijfers, zonder de extra voorloop-`1` die er nu soms voor staat (dus `001`, niet `1001`).

## Aanpassingen

### 1. `src/lib/generateAuditReport.ts`
- Voeg een helper `auditSoortLabel` toe die `projectaudit` → "Projectaudit" en `dossieraudit` → "Dossieraudit" vertaalt.
- Pas `nrStr` aan: gebruik alleen `String(adviseurNummer).padStart(3, "0")`, zonder voorloop-`1`.
- Neem het auditsoort-label op in `documentTitle`.

Voorbeeld van de nieuwe titel:
```
001 Jan Jansen 1234AB_5 Projectaudit
```

### 2. `src/components/projecten/BulkPdfExport.tsx`
- Voeg het auditsoort-label toe aan de `parts`-array die per project de PDF-bestandsnaam samenstelt.
- Het adviseursnummer hier is al correct (`padStart(3, "0")` zonder extra `1`); dat blijft zo.

Voorbeeld van de nieuwe bestandsnaam in de bulk-ZIP:
```
001 Jan Jansen 1234AB_5 EPWB Projectaudit.pdf
```

## Niet in scope
- Geen database-wijzigingen.
- Geen wijziging aan de inhoud van het rapport zelf (alleen bestandsnaam/titel).
- Geen aanpassingen aan de naam van de bulk-ZIP zelf.