# Plan

## Doel
Zorgen dat de prullenbakjes zichtbaar zijn op de plek die jij bedoelt: **Projectdetail teamnamen**.

## Wat ik ga doen
1. Controleren waarom jij ze niet ziet ondanks dat de UI al in `BeheerStandVanZaken` staat.
2. De zichtbaarheid corrigeren op basis van de echte oorzaak:
   - verkeerde scherm/route
   - alleen zichtbaar voor `beheer`
   - alleen zichtbaar als er echt een gekoppelde gebruiker/adviseur is
   - component staat in een beheer-only blok en verschijnt daarom niet in jouw huidige weergave
3. Daarna de knop exact op de teamregel laten tonen met bevestigingsvraag voor verwijderen/loskoppelen.
4. In de preview valideren dat de knop zichtbaar is op een bestaand projectdetail en niet alleen in code aanwezig is.

## Verwachte aanpassing
Waarschijnlijk moet ik niet de logica van het prullenbakje zelf opnieuw bouwen, maar de **render-voorwaarden** of de **plek waar de component wordt getoond** aanpassen, zodat jij hem ook echt ziet in het scherm waar je kijkt.

## Technische details
- Bestaande component: `src/components/projecten/BeheerStandVanZaken.tsx`
- Huidige inbouw: `src/pages/ProjectDetail.tsx`
- Huidige voorwaarden:
  - `Stand van zaken` wordt alleen gerenderd voor `hasRole("beheer")`
  - knop verschijnt alleen als `project.toegewezen_aan` of `project.adviseur_id` gevuld is
- Ik verifieer dit op een bestaand projectdetail in de preview, niet alleen via code.

## Resultaat
Na implementatie moet op de projectdetailpagina achter de teamnaam een prullenbakje staan, met een bevestigingsvraag voordat de koppeling wordt verwijderd.