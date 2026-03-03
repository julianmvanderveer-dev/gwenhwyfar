

# EP-adviseurs sectie toevoegen aan Beheer

## Wat
Een derde sectie toevoegen aan `src/pages/Beheer.tsx` die alle EP-adviseurs toont met hun naam, nummer, e-mailadres en actief-status. De data komt uit de bestaande `adviseurs` tabel.

## Aanpak

### Bestand: `src/pages/Beheer.tsx`
- State toevoegen: `adviseurs` array ophalen uit de `adviseurs` tabel (`select("*").order("naam")`)
- Laden in `useEffect` naast de bestaande `loadUsers` en `loadProjects`
- Nieuwe sectie onderaan de pagina met een tabel:
  - Kolommen: **Nummer**, **Naam**, **E-mail**, **Actief**
  - Actief als klikbare toggle (net als bij gebruikers)
- Export-knop toevoegen voor EP-adviseurs CSV

Geen database-wijzigingen nodig — de `adviseurs` tabel bestaat al met de juiste kolommen (nummer, naam, email, actief).

