

# Rollen herstellen en beveiliging toevoegen

## Probleem
Door het aan/uitklikken van rollen op de Beheerpagina is de "beheer" rol van je eigen account (julian@borgch.nl) verwijderd. Omdat de RLS-policy vereist dat je de "beheer" rol hebt om rollen te beheren, kun je die niet meer terugzetten via de interface. De pagina probeert de rol steeds opnieuw in te voegen maar krijgt telkens een 403-fout.

## Aanpak

### 1. Database: beheer-rol herstellen
- Via een SQL-migratie de "beheer" rol terugzetten voor gebruiker `498a1983-4b17-4e84-b78f-27f99835a1f5`

### 2. Code: zelfbeveiliging toevoegen (`src/pages/Beheer.tsx`)
- Voorkom dat een gebruiker zijn eigen "beheer" rol kan uitvinken
- Toon de checkbox als uitgeschakeld (disabled) met een tooltip of visuele indicatie
- Dit voorkomt dat je jezelf per ongeluk buitensluit

