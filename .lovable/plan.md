

## Plan: Auditrapport downloaden als PDF

### Wat
Een "Download rapport" knop op de projectdetailpagina, zichtbaar voor beheerders en EP-adviseurs bij afgeronde/gesloten audits. Genereert een mooi opgemaakt rapport dat via de browser als PDF kan worden opgeslagen (print-to-PDF).

### Aanpak

Geen externe PDF-library nodig — een gestileerd HTML-document in een nieuw venster met `window.print()` levert een schoon PDF-resultaat op en is onderhoudsarm.

### Rapport inhoud
- **Koptekst**: Logo/titel "Auditrapport", projectnaam, datum
- **Projectgegevens**: categorie, soort, toelatingsaudit, prioriteit, adviseur, status, aanmaakdatum
- **EP2 Beoordeling**: start/eindwaarde, afwijking, beoordeling
- **Bevindingen per onderdeel**: tabel met code, controlepunt, deel, beoordeling, type afwijking, toelichting, deadline, status
- **Samenvatting**: aantal goed/niet goed/opmerkingen, aantal kritiek/niet-kritiek

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/generateAuditReport.ts` | Nieuw: functie die HTML genereert en print-venster opent |
| `src/pages/ProjectDetail.tsx` | "Download rapport" knop toevoegen (zichtbaar voor beheer + ep_adviseur, status afgerond/gesloten/wacht_op_reactie) |

### Zichtbaarheid knop
- Rollen: `beheer` of `ep_adviseur`
- Statussen: `afgerond`, `gesloten`, `wacht_op_reactie`

