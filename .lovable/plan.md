

# Rollenoverzicht toevoegen aan Beheer + roldata instellen

## Wat
1. **Data**: De genoemde rolkoppelingen instellen in de database via de user_roles tabel (julian+betty → beheer, stefan+hilbert → tekenaar, frank+wilco → auditor).
2. **UI**: Een apart "Rollenoverzicht" sectie toevoegen aan `src/pages/Beheer.tsx`, gegroepeerd per rol (net als de EP-adviseurs tabel), met de mogelijkheid om gebruikers toe te voegen/verwijderen per rol.

## Aanpak

### 1. Roldata invoegen
- E-mailadressen opzoeken in de `profiles` tabel om de user_id's te vinden.
- Bijbehorende rollen invoegen in `user_roles` (als ze nog niet bestaan).

### 2. Rollenoverzicht sectie in Beheer.tsx
- Nieuwe sectie onder de EP-adviseurs tabel.
- Per rol (Beheer, Tekenaar, Auditor, EP-adviseur) een blok met:
  - Lijst van gebruikers met die rol (naam + e-mail).
  - Verwijderknop per gebruiker.
  - Toevoegknop: dropdown/select met beschikbare gebruikers (uit profiles) om een rol toe te kennen.
- Hergebruikt bestaande `profiles` en `user_roles` data die al geladen wordt.

### Bestanden
- `src/pages/Beheer.tsx` — nieuwe "Rollenoverzicht" sectie toevoegen
- Database — roldata invoegen via insert tool

