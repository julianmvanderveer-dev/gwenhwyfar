

# Tabbladen logisch ordenen + navigatieknoppen

## Probleem
- In de database staat "Dossier" zonder "1." prefix, terwijl de andere onderdelen wel nummering hebben. Hierdoor komt "Dossier" niet op de juiste plek.
- EP2 Beoordeling moet als tabblad 6 worden weergegeven.
- Er zijn geen navigatieknoppen om tussen tabbladen te navigeren.

## Aanpak

### 1. Database fix: "Dossier" hernoemen naar "1. Dossier"
- SQL-migratie om alle findings met `onderdeel = 'Dossier'` te updaten naar `onderdeel = '1. Dossier'`.
- Ook in de `checklist_templates` tabel als daar dezelfde waarde staat.

### 2. EP2 als "6. EP2 Beoordeling"
- De TabsTrigger voor EP2 hernoemen naar "6. EP2 Beoordeling".

### 3. Navigatieknoppen toevoegen (`src/pages/ProjectDetail.tsx`)
- Controlled Tabs met `activeTab` state.
- Alle tabbladen in een array: `[...onderdelen, "__ep2__"]`.
- Onder elke tab-content "Vorige" en "Volgende" knoppen tonen die naar het vorige/volgende tabblad navigeren.
- Eerste tab toont alleen "Volgende", laatste tab alleen "Vorige".

### Bestanden
- `src/pages/ProjectDetail.tsx` — controlled tabs, navigatieknoppen, EP2 label
- Database migratie — fix "Dossier" → "1. Dossier"

