# Extra documenten uploaden en documenten altijd zichtbaar

## Wat er verandert

1. **Nieuw onderdeel "Extra documenten" op het laatste tabblad (EP2 Beoordeling)**
   - De EP-adviseur van het project kan hier zelf documenten uploaden, los van een auditpunt. Toegestaan zijn PDF, Word, Excel en afbeeldingen, tot 20 MB per bestand. Een korte omschrijving is optioneel.
   - Er komt een lijst met alle extra documenten: bestandsnaam, omschrijving, wie het heeft geüpload, de datum en een downloadknop.
   - De auditor en beheer zien dezelfde lijst. Ook zij kunnen documenten toevoegen.
   - Dit kan in elke fase, ook als de audit al is afgerond.
   - De auditor krijgt een melding (bel en e-mail) als de adviseur een extra document uploadt.
   - Alleen beheer kan een document verwijderen. Dit voorkomt dat bewijs per ongeluk verdwijnt.

2. **Documenten blijven altijd zichtbaar**
   - Nu kan een auditor een document alleen openen als het project op dat moment aan hem is toegewezen of in de pool staat. Wordt een project vrijgegeven of overgedragen, dan kan hij de documenten niet meer openen.
   - Straks kunnen alle auditors, tekenaars en beheerders altijd alle documenten openen. Dit geldt voor bijlagen bij auditpunten, nieuwe labels en de nieuwe extra documenten.
   - De EP-adviseur kan de documenten van zijn eigen projecten altijd blijven openen, ook na afronding en ook via "Mijn audits".
   - Uploaden en wijzigen blijven gebonden aan de huidige regels. Alleen het bekijken wordt ruimer.

## Technische details
- Nieuwe tabel `project_documenten`: `id`, `project_id`, `bestandsnaam`, `bestand_pad`, `omschrijving`, `geupload_door` (verwijst naar profiles), `created_at`. Inclusief GRANTs en RLS. Lezen mag voor interne rollen en voor de adviseur van het eigen project. Toevoegen mag voor dezelfde groep, met `geupload_door = auth.uid()`. Verwijderen alleen door beheer.
- Bestanden komen in de bestaande bucket `project-documents` onder `{project_id}/extra/...`. De bestaande insert-regel voor deze bucket staat de adviseur van het project al toe.
- Leesregels (SELECT-policies) voor de buckets `finding-documents` en `project-documents` worden verruimd: `has_any_role(beheer, auditor, tekenaar)` OF de adviseur van het project.
- Nieuw component `src/components/projecten/ExtraDocumenten.tsx`, onder de EP2-inhoud geplaatst in `src/pages/ProjectDetail.tsx`. Downloads gaan via signed URL's die 1 uur geldig zijn.
- `notify-auditor` krijgt een nieuw type `extra_document`, met een nieuw e-mailsjabloon en een in-app notificatie. Lukt de mail niet, dan blijft de upload gewoon staan.
