

## Plan: EP-adviseur reactie uitbreiden met accepteren/afwijzen + bestandsupload

### Huidige situatie
De FindingReactie-pagina laat de EP-adviseur alleen een tekstreactie sturen. Er is geen optie om een finding te accepteren of af te wijzen, en geen bestandsupload. In het Inbox-overzicht staat altijd "Reageren" ongeacht of er al gereageerd is.

### Wijzigingen

#### 1. Database: Storage bucket + messages bijlage-kolom

**Storage bucket** aanmaken voor document-uploads (max 10MB):
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('finding-documents', 'finding-documents', false, 10485760);
```
Plus RLS-policies zodat geauthenticeerde gebruikers met de juiste rollen kunnen uploaden/lezen.

**Kolom toevoegen aan messages-tabel:**
```sql
ALTER TABLE messages ADD COLUMN bijlage_pad text;
```
Slaat het pad op in de storage bucket.

#### 2. FindingReactie.tsx - Accepteren/Afwijzen + upload

De reactiepagina wordt omgebouwd:

- **Twee knoppen**: "Accepteren" en "Niet akkoord"
- **Accepteren**: zet finding status naar `reactie_ontvangen` met een automatisch bericht "Afwijking geaccepteerd"
- **Niet akkoord**: toont een tekstveld + bestandsupload (max 10MB). De adviseur moet een reactie geven en kan optioneel een document bijvoegen
- **Bestandsupload**: via een file input, upload naar `finding-documents/{finding_id}/{filename}`, sla het pad op in `messages.bijlage_pad`
- Bestaande berichten tonen eventuele bijlagen als download-link

#### 3. Inbox.tsx - Status weergave in EP-adviseur overzicht

De kolom "Actie" in het EP-adviseur overzicht aanpassen:
- `status === "open"` → Link "Reageren"  
- `status === "reactie_ontvangen"` → Badge/tekst "Reactie ingediend" (geen link meer, of link naar readonly weergave)

Dit geeft de adviseur direct inzicht in welke findings nog actie vereisen.

### Overzicht bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `messages.bijlage_pad` kolom + storage bucket + RLS |
| `src/pages/FindingReactie.tsx` | Accepteren/Niet-akkoord flow + bestandsupload |
| `src/pages/Inbox.tsx` | Actie-kolom: "Reageren" vs "Reactie ingediend" |

