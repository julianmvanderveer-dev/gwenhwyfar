# Pop-up "Nieuw: uw persoonlijke Overzicht" maximaal 2 keer tonen

## Doel
De pop-up over het nieuwe tabblad "Overzicht" verschijnt bij EP-adviseurs nu maar één keer. Julian wil dat hij maximaal 2 keer verschijnt (bij de eerste twee logins), daarna nooit meer.

## Aanpassing
Bestand: `src/components/dashboard/NieuwOverzichtMelding.tsx`

- Vervang de huidige "gezien"-vlag in localStorage door een teller (`bengaudit_overzicht_melding_count`).
- Bij het laden: toon de pop-up alleen als de teller lager is dan 2 én de einddatum (23-11-2026) nog niet verstreken is.
- Verhoog de teller bij elke weergave (niet pas bij sluiten, zodat verversen niet opnieuw telt als extra login).
- Bestaande gebruikers die de pop-up al gezien hebben (oude sleutel aanwezig) starten op teller 1, zodat zij hem nog één keer zien.

## Technische details
- Alleen frontend, geen database- of backendwijziging.
- De bestaande einddatum-logica (TOON_TOT = 23-11-2026) blijft ongewijzigd.
