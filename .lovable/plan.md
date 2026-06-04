## Dropbox-link toevoegen aan project

**Doel**: Bij projectaanmaak een optioneel veld voor de Dropbox-link van het dossier, zichtbaar als klikbare link in de projectheader zodat tekenaar/auditor het maar één keer hoeft op te zoeken.

### Datamodel
- Migratie: `ALTER TABLE public.projects ADD COLUMN dropbox_link text;` (nullable, geen default — leeg = geen link).
- Geen RLS-aanpassing nodig: valt onder bestaande policies van `projects`.

### Project aanmaken (`src/pages/ProjectAanmaken.tsx`)
- Nieuw optioneel tekstveld **"Dropbox-link dossier"** (`<Input type="url">`), onder de bestaande velden.
- State `dropboxLink`, meegestuurd bij insert als `dropbox_link: dropboxLink.trim() || null`.

### Project detail (`src/pages/ProjectDetail.tsx`)
- In de projectheader, naast bestaande badges, een knop/link **"📁 Dossier op Dropbox"** (`<a target="_blank" rel="noopener noreferrer">`) als `project.dropbox_link` is ingevuld.
- Voor beheer/tekenaar/auditor: link is ook bewerkbaar via een klein potlood-icoon → inline `<Input>` met auto-save (`onBlur`) volgens het bestaande auto-save patroon. EP-adviseur ziet alleen de link (read-only).

### Buiten scope
- Geen Dropbox-API integratie, geen validatie van de URL behalve basis `type="url"`, geen previews.
