## Doel
Beheer kan een project **volledig verwijderen** (inclusief bevindingen, reacties, uitdraai en externe rapportages), zowel vanuit het projectenoverzicht in de Inbox als vanuit de projectdetailpagina.

## Huidige situatie
- Foreign keys op `findings`, `externe_rapportages` en `project_uitdraai` staan al op `ON DELETE CASCADE` — een `DELETE FROM projects` ruimt de bijbehorende data dus automatisch op.
- In de Inbox-tabel (`FaseTabel`) staat al een prullenbak-icoon per rij met bevestigingsdialoog. Die is functioneel, maar visueel klein en niet duidelijk "beheer-only".
- Op de projectdetailpagina (`ProjectDetail.tsx`) ontbreekt een verwijder-knop volledig.

## Wijzigingen

### 1. Projectdetailpagina (`src/pages/ProjectDetail.tsx`)
- Voeg in de header, alleen zichtbaar als `hasRole("beheer")`, een rode "Project verwijderen"-knop toe (naast de bestaande status-select).
- Klik opent een `AlertDialog` met duidelijke waarschuwing:
  > "Weet je zeker dat je '{projectnaam}' volledig wilt verwijderen? Alle bevindingen, reacties, uitdraai en rapportages worden definitief verwijderd. Deze actie kan niet ongedaan gemaakt worden."
- Bij bevestigen: `await supabase.from("projects").delete().eq("id", project.id)` → toast → `navigate("/inbox")`.
- Bij eventuele FK-error: foutmelding tonen in toast.

### 2. Inbox-overzicht (`src/components/projecten/FaseTabel.tsx`)
- De huidige rij-prullenbak blijft bestaan, maar wordt iets duidelijker:
  - Tooltip "Project volledig verwijderen (alle bevindingen, reacties en uitdraai)".
  - Tekst in de `AlertDialogDescription` aanscherpen zodat duidelijk is dát álles meegaat (nu staat er alleen "findings worden ook verwijderd").
- Geen wijziging aan de logica zelf; `deleteProject` in `Inbox.tsx` blijft `delete from projects` (cascade doet de rest).

### 3. Geen database-/RLS-wijzigingen nodig
- Cascade staat al goed.
- RLS-policy voor `projects DELETE` voor beheer bestaat al (anders zou de huidige Inbox-knop nu ook niet werken).

## Buiten scope
- Soft-delete / archief-herstel.
- Verwijderen van losse bevindingen of reacties.
- Audit-log van verwijderingen (zou later los kunnen).
