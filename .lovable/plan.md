## Probleem

De storage-buckets `finding-documents` en `project-documents` staan op dit moment alleen PDF, JPEG, PNG en WebP toe. Daardoor weigert de backend `.xlsm` (en ook `.xlsx`, `.xls`, Word, etc.) met de melding *"mime type application/vnd.ms-excel.sheet.macroenabled.12 is not supported"*. Het is dus géén platformbeperking, maar onze eigen whitelist.

## Oplossing

Whitelist uitbreiden met de gangbare Office- en tekstformaten zodat adviseurs rekentools en onderbouwingen kunnen meesturen.

### Migratie

Eén migratie die beide buckets bijwerkt:

- `application/pdf`
- `image/jpeg`, `image/png`, `image/webp`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)
- `application/vnd.ms-excel.sheet.macroenabled.12` (`.xlsm`)
- `application/vnd.ms-excel` (`.xls`)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
- `application/msword` (`.doc`)
- `text/csv`, `text/plain`

Bestaande limiet van 20 MB blijft staan; de UI-tekst "Max 10 MB" laat ik ongemoeid (zit elders en is een aparte UX-keuze — laat weten als die ook aangepast moet).

### Frontend

Geen wijzigingen nodig. De `<input type="file">` voor "Document bijvoegen" heeft geen `accept`-filter dat Excel uitsluit; zodra de bucket het accepteert werkt de upload.

## Buiten scope

- Virusscanning van geüploade macro-bestanden. Word je daar later bewuster van, dan kunnen we een edge function voor scanning toevoegen.
- UI-tekst "Max 10 MB" aanpassen (werkelijke limiet is 20 MB).
