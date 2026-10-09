# Uploads extra documenten beperken tot reactiefase

## Doel
Extra documenten bij een audit mogen alleen worden geüpload zolang de audit bij de EP-adviseur ligt voor reactie (status `wacht_op_reactie`). Daarna (afgerond, gesloten, enz.) blijven de documenten zichtbaar en downloadbaar voor adviseur, auditor en beheer, maar is uploaden niet meer mogelijk.

## Wijzigingen

1. **Frontend — `src/components/projecten/ExtraDocumenten.tsx`**
   - Component krijgt de projectstatus mee (prop vanuit `ProjectDetail.tsx`).
   - Uploadblok (omschrijving + knop) alleen tonen als status `wacht_op_reactie` is én de gebruiker uploadrecht heeft (adviseur van het project of interne rol).
   - Bij andere statussen: alleen de documentenlijst met downloadknoppen; verwijderen door beheer blijft mogelijk.
   - Tekst onder de titel aanpassen: vermelden dat uploaden alleen kan tijdens de reactiefase.

2. **Database — afdwingen via RLS (migratie)**
   - INSERT-policy op `project_documenten` aanscherpen: een insert mag alleen als het bijbehorende project status `wacht_op_reactie` heeft. Zo kan uploaden ook niet via een omweg buiten de schermen om.
   - SELECT- en DELETE-policies ongewijzigd: inzien blijft altijd mogelijk, verwijderen blijft voorbehouden aan beheer.

## Technische details
- Statusbron: `projects.status` (enum `project_status`), waarde `wacht_op_reactie`.
- Geen wijziging aan bestaande documenten, notificaties of e-mails.

## Verificatie
- Build controleren.
- Handmatig checken: project in reactiefase toont uploadknop; afgerond project toont alleen de lijst met downloads.
