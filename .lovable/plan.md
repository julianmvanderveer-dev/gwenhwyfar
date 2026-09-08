# Projectteam-tabel horizontaal scrollbaar maken

## Probleem
Op Beheer → Projectteam is de tabel (Naam, E-mail, 3 projectrollen, 6 checklistbevoegdheden, Wachtwoord, Acties) breder dan het scherm. De container om de tabel gebruikt `overflow-hidden`, waardoor de rechterkolommen worden afgeknipt en er niet horizontaal gescrold kan worden. Zo zijn o.a. het wachtwoordveld en de actieknoppen onbereikbaar.

## Oplossing
In `src/pages/Beheer.tsx` (regel ~574):
- De tabel-container krijgt `overflow-x-auto` in plaats van `overflow-hidden`, zodat de tabel horizontaal scrollbaar wordt op smallere schermen.
- De tabel krijgt een minimale breedte (`min-w-[...]` of `whitespace-nowrap` waar nodig) zodat kolommen niet onleesbaar samengeperst worden.
- Afgeronde hoeken en rand blijven visueel intact.

## Technisch
- Alleen CSS-klassen aanpassen in de Projectteam-tab; geen logica- of datawijzigingen.
- Controleren of andere brede tabellen op de beheerpagina (bv. adviseurs, foutenanalyse) hetzelfde euvel hebben en daar dezelfde fix toepassen.
