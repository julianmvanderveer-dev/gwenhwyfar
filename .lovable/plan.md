

# Inbox aanpassingen: verwijderen + kleurcodering

## 1. Projecten verwijderen in Inbox
- Verwijder-knop (prullenbak-icoon) toevoegen in de projectentabel, alleen zichtbaar voor gebruikers met de rol `beheer`
- Bevestigingsdialoog via `AlertDialog` voordat het project daadwerkelijk verwijderd wordt
- Bij verwijderen: eerst alle gekoppelde findings en messages verwijderen (cascade), daarna het project zelf
- Na verwijderen: lijst herladen

**Bestand:** `src/pages/Inbox.tsx`
- Extra kolom "Actie" in de projectentabel
- `deleteProject(id)` functie met `supabase.from("projects").delete().eq("id", id)`
- Import AlertDialog + Trash2 icoon

## 2. Kleurcodering beoordeling in EP-adviseur findings-tabel
In de EP-adviseur sectie (openstaande audits) de kolom "Beoordeling" een kleur-badge geven:
- **GOED** → groen (`bg-green-100 text-green-700`)
- **NK** (niet_kritiek) → oranje (`bg-orange-100 text-orange-700`)
- **KT** (kritiek) → rood (`bg-red-100 text-red-700`)

Eveneens de kolom "Type afwijking" kleuren met dezelfde mapping.

**Bestand:** `src/pages/Inbox.tsx` — kleine helper-functie voor kleurklasse op basis van waarde, toegepast in de EP-adviseur tabel-rijen.

## Technische details
- Delete cascade: de foreign keys op `findings.project_id` en `messages.finding_id` hebben al `ON DELETE CASCADE` ingesteld in de database, dus `supabase.from("projects").delete()` volstaat
- RLS: de bestaande `Projects delete` policy staat alleen `beheer` toe, dus de knop werkt alleen voor die rol
- Geen database-migratie nodig

