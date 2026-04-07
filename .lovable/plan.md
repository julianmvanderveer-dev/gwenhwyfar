

# Alle testdata verwijderen

## Wat er wordt gedaan
Een eenmalige database-migratie die alle testprojecten en gerelateerde data verwijdert. Adviseurs blijven behouden.

## Volgorde van verwijderen (vanwege data-afhankelijkheden)
1. `messages` — alle berichten bij findings
2. `notificaties` — alle notificaties
3. `project_uitdraai` — alle geüploade uitdraaien
4. `externe_rapportages` — alle externe rapportages
5. `findings` — alle 423 findings
6. `projects` — alle 10 testprojecten

## Wat blijft staan
- `adviseurs` — alle EP-adviseurs blijven bewaard
- `profiles` en `user_roles` — alle gebruikersaccounts en rollen
- `checklist_templates`, `sectoren`, `modules` — configuratie

## Technisch
Eén SQL-migratie met 6 DELETE-statements in de juiste volgorde. Geen code-wijzigingen nodig.

