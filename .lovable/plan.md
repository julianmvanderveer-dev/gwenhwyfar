# EP2-beoordeling op GOED bij een schone audit

## Wat er nu misgaat

De automatische beoordeling ziet een controlepunt met "N.V.T." aan voor een afwijking. In het gemelde project staan 30 punten op Goed, 1 op Opmerking en 7 op N.V.T., en geen enkele op Niet goed — toch komt de beoordeling op NKT uit. Ook zonder EP2-afwijking blijft die NKT staan.

## Wat we gaan doen

- "N.V.T." telt niet langer mee als afwijking bij de automatische beoordeling; net als Goed, Opmerking en nog niet beoordeelde punten.
- Zijn er geen punten op "Niet goed" en valt de EP2-waarde binnen de marges, dan komt de beoordeling automatisch op GOED.
- De toelichtingsregel onder de beoordeling blijft kloppen: bij NKT wordt het aantal echte fouten genoemd, bij GOED "geen afwijkingen".
- Handmatig instellen van de beoordeling blijft mogelijk en blijft voorrang houden; afgeronde audits worden niet opnieuw herrekend.
- Het gemelde project wordt eenmalig opnieuw beoordeeld zodat de juiste waarde er meteen staat.

## Technische details

- `src/pages/ProjectDetail.tsx`, `autoEp2`: in de `alleGoed`-check `"nvt"` toevoegen aan de toegestane beoordelingen. Daarmee valt NKT weg als er alleen goed/opmerking/nvt/leeg staat.
- KT-criteria (EP2-marges en meer dan 4 relevante afwijkingen) blijven ongewijzigd.
- Data: voor project 49181a8a (indien nog niet handmatig vastgezet en niet in een vastgezette status) `ep2_beoordeling` bijwerken naar `goed`.
