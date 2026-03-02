

# Subcode (nieuwe rij) toevoegen aan Checklist Beheer

## Wat
Een "+" knop toevoegen per onderdeel-groep (of onderaan de tabel) waarmee een nieuw checklist-item wordt aangemaakt. De code wordt automatisch bepaald: het volgende vrije subletter (a, b, c...) achter het hoofdnummer van dat onderdeel.

## Aanpassingen in `src/pages/ChecklistBeheer.tsx`

1. **"+ Rij toevoegen" knop** per categorie-tab, onderaan de tabel of per onderdeel-groep.
2. **`addItem` functie**: 
   - Vraagt het hoofdnummer van het onderdeel (of detecteert het uit de laatste rij).
   - Berekent de volgende vrije letter (bijv. als "5i" bestaat → "5j").
   - Voegt een nieuw item toe aan lokale state met een tijdelijk UUID.
   - Insert direct naar de database (`checklist_templates`).
3. **Optioneel: verwijderknop** per rij zodat ongewenste items ook weer weg kunnen.

## Technische details

- Nieuwe items worden via `supabase.from("checklist_templates").insert(...)` opgeslagen (niet via de batch-save, maar direct bij toevoegen).
- De `audit_categorie` wordt overgenomen van het actieve tabblad.
- Het `onderdeel` wordt overgenomen van het laatste item in dezelfde groep.
- Een verwijderknop per rij maakt het beheer compleet (delete via `supabase.from("checklist_templates").delete().eq("id", id)`).

Alleen `ChecklistBeheer.tsx` wordt aangepast, geen database- of routewijzigingen nodig.

