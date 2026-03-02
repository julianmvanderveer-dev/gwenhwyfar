

# Alles goedkeuren + Eindtabblad EP2

## 1. "Alles goedkeuren" knop per tabblad
In `ProjectDetail.tsx` een knop toevoegen bovenaan elk onderdeel-tab die alle findings in dat tabblad in één keer op "goed" zet (alleen als de gebruiker bewerkingsrechten heeft).

- Batch-update via `supabase.from("findings").update({ beoordeling: "goed" }).in("id", [...])`
- Alleen zichtbaar als canDeel1 of canDeel2

## 2. Eindtabblad (tab 6) voor EP2-beoordeling
Een extra tab "EP2 Beoordeling" toevoegen aan de tablijst met:
- Invoerveld: **Startwaarde EP2** (kWh/m²)
- Invoerveld: **Eindwaarde EP2** (kWh/m²)
- Berekend: **Afwijking absoluut** (eindwaarde − startwaarde)
- Berekend: **Afwijking %** ((afwijking / startwaarde) × 100)
- Selectievakje: **GOED / NK / KT**

Alleen bewerkbaar door auditor (canDeel2).

## 3. Database-wijziging
Nieuwe kolommen op `projects` tabel:
- `ep2_startwaarde` (numeric, nullable)
- `ep2_eindwaarde` (numeric, nullable)
- `ep2_beoordeling` (text, nullable) — waarden: "goed", "niet_kritiek", "kritiek"

## Technische details
- Migratie: `ALTER TABLE projects ADD COLUMN ep2_startwaarde numeric, ADD COLUMN ep2_eindwaarde numeric, ADD COLUMN ep2_beoordeling text`
- Afwijking absoluut en % worden client-side berekend (niet opgeslagen)
- Alle wijzigingen in `src/pages/ProjectDetail.tsx`, plus één migratie

