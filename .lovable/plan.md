

## Plan: Projectteam-tab opschonen

### Wijzigingen in `src/pages/Beheer.tsx`

1. **EP-rollen kolom en groepsheader verwijderen** uit de Projectteam-tabel:
   - Verwijder de "EP-rollen" `<th colSpan={1}>` groepsheader (regel 180-182)
   - Verwijder de EP_ROLES kolomheader loop (regel 194-198)
   - Verwijder de EP_ROLES checkbox loop per rij (regel 222-233)
   - Pas colSpan van lege eerste cel aan

2. **Verwijder-knop toevoegen** per medewerker in de Projectteam-tabel:
   - Nieuwe kolom rechts met een Trash2-icoon button
   - Bevestigingsdialoog (`confirm()`) voor verwijdering
   - Verwijdert het profiel uit de `profiles` tabel (cascade verwijdert ook user_roles)
   - Eigen account kan niet verwijderd worden (disabled knop)

3. **CSV export aanpassen** — EP-adviseur kolom niet meer meenemen in Projectteam export

Geen database-wijzigingen nodig.

