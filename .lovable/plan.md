## Doel
In de Beheer-tab "Projecten" een directe Dropbox-knop tonen per rij in de Afgerond-tabel, zodat je vanuit het overzicht in één klik naar de Dropbox-omgeving van een afgerond project gaat — zonder eerst het project te openen.

## Wijzigingen

### 1. `src/components/projecten/FaseTabel.tsx`
- Type `Project` uitbreiden met `dropbox_link?: string | null`.
- In de afgerond-weergave (`isAfgerondView`) een extra kolom **"Dossier"** tonen, na de kolom "Afgerond op".
  - Als `dropbox_link` aanwezig: een kleine knop/link met mapicoon + tekst "Dropbox" die in een nieuw tabblad opent (`target="_blank"`, `rel="noopener noreferrer"`).
  - Als leeg: `—`.
- Headerregel uitbreiden met bijbehorende `<th>` "Dossier" (alleen wanneer `isAfgerondView`).

### 2. Datalaag — `dropbox_link` meeleveren aan FaseTabel
Locaties waar de afgerond-lijst wordt opgebouwd en aan `FaseTabel` doorgegeven worden, krijgen `dropbox_link` toegevoegd in hun Supabase-select:
- `src/pages/Inbox.tsx` (`afgerond`-groep in `hoofdgroepen`).
- `src/pages/Beheer.tsx` (de tab/lijst die afgeronde projecten toont).
- `src/components/projecten/BeheerStandVanZaken.tsx` voor zover deze afgerond-rijen rendert via FaseTabel.

Geen andere bestaande kolommen of gedrag wijzigen; lopende fases blijven ongewijzigd (de Dropbox-link blijft daar via de projectdetailpagina bereikbaar zoals nu).

### 3. Geen backend-wijzigingen
Het veld `projects.dropbox_link` bestaat al; geen migratie nodig.

## Out of scope
- 14-dagen-archiveringsfilter in Inbox (blijft ongewijzigd).
- Dropbox-kolom in andere fases dan "Afgerond".
- Wijzigingen aan ProjectDetail (Dropbox-link staat daar al en blijft zichtbaar voor alle statussen).