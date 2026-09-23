# Knop "Audit afronden" direct beschikbaar na invullen EP2

## Wat er nu misgaat

De EP2-waarden en de beoordeling worden wel meteen opgeslagen, maar het projectscherm werkt zijn eigen gegevens daarna niet bij. De controle of EP2 compleet is, kijkt naar die verouderde gegevens. Daardoor blijft de knop "Audit afronden" geblokkeerd tot je het project verlaat en opnieuw opent.

## Wat we gaan doen

- Zodra een EP2-waarde of de beoordeling is opgeslagen, werkt het scherm zijn eigen gegevens direct bij.
- De knop "Audit afronden" komt daardoor meteen beschikbaar zodra startwaarde, eindwaarde en beoordeling zijn ingevuld — zonder het project opnieuw te openen.
- De melding "EP2 nog niet compleet" bij het afronden gebruikt dezelfde actuele gegevens, zodat die niet onterecht verschijnt.
- Alle bestaande regels blijven gelden: alleen de auditor kan afronden, EP-adviseurs van hetzelfde project niet, en de verplichte toelichting bij correcties na afronding blijft ongewijzigd.

## Technische details

- `src/pages/ProjectDetail.tsx`, `saveEp2Field`: na een geslaagde update ook de lokale `project`-state bijwerken (`setProject(prev => prev ? { ...prev, ...update } : prev)`); bij een fout een foutmelding tonen in plaats van stil falen.
- `ep2Compleet` en de controle in `auditAfronden` baseren op die bijgewerkte state (eventueel met fallback op de ingevoerde velden `ep2Start` / `ep2Eind` / `ep2Beoordeling`).
- De dialoogflow voor EP2-correcties na afronding (`bevestigEp2Wijziging`) werkt de state al bij via `loadProject()` en blijft ongewijzigd.
