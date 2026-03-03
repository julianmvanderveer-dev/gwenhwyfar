

# Beheer-pagina herstructureren met tabs

## Wat
De Beheer-pagina opsplitsen in tabs. Het projectenoverzicht verplaatsen naar een eigen tab "Projecten", waar ook de Inbox-functionaliteit (projectenlijst met links, delete-functie) en de "Nieuw project"-functie worden samengevoegd. De overige secties (Gebruikers, EP-adviseurs, Rollen) blijven in hun eigen tabs.

## Structuur

```text
Beheer
├── Tab: Projecten
│   ├── "Nieuw project" knop (opent inline formulier of navigeert naar /project/nieuw)
│   ├── Projectentabel (uit huidige Beheer + Inbox gecombineerd)
│   │   ├── Link naar projectdetail
│   │   ├── Status, Categorie, Soort, Adviseur, Prioriteit, Datum
│   │   ├── Verwijderknop met bevestigingsdialoog
│   │   └── Export CSV knop
│   └── Findings te beoordelen (indien auditor/tekenaar)
├── Tab: Gebruikers
│   └── Huidige gebruikerstabel + actief toggle + rolcheckboxes
├── Tab: EP-adviseurs
│   └── Huidige adviseurstabel met CRUD
├── Tab: Rollen
│   └── Huidige rollenoverzicht per rol
```

## Aanpak

### Bestand: `src/pages/Beheer.tsx`
- `Tabs` component importeren en de pagina-inhoud verdelen over 4 tabs
- **Tab "Projecten"**: projectentabel verplaatsen + "Nieuw project" knop toevoegen (link naar `/project/nieuw`) + verwijderknop met AlertDialog (uit Inbox overgenomen) + export CSV
- **Tab "Gebruikers"**: bestaande gebruikerstabel
- **Tab "EP-adviseurs"**: bestaande adviseur CRUD-tabel
- **Tab "Rollen"**: bestaande rollenoverzicht

### Bestand: `src/components/AppLayout.tsx`
- Nav-links "Inbox" en "Nieuw project" behouden voor niet-beheer rollen
- Voor beheer-rol kan "Nieuw project" link optioneel verwijderd worden uit de navbar (aangezien het nu in de Projecten-tab zit)

Geen database-wijzigingen nodig.

