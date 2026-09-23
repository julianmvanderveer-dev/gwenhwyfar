# Toelichting blijft behouden bij wisselen van tabblad

## Wat er nu gebeurt

Een getypte toelichting wordt pas opgeslagen op het moment dat je het tekstvak verlaat, en het projectscherm onthoudt de nieuwe tekst daarna niet in zijn eigen geheugen. Zodra je naar een ander tabblad gaat, wordt het tabblad opgeruimd en bij terugkeer wordt de oude (vaak lege) tekst weer getoond. Bij snel klikken kan het opslaan bovendien halverwege afgebroken worden, waardoor de tekst echt verloren gaat.

## Wat we gaan doen

1. **Automatisch opslaan tijdens typen** — de toelichting wordt ongeveer een seconde na de laatste toetsaanslag vanzelf opgeslagen, dus ook zonder het vak te verlaten.
2. **Opslaan bij weggaan** — verlaat je het vak of het tabblad, dan wordt een nog niet opgeslagen wijziging alsnog weggeschreven.
3. **Onthouden in het scherm** — na elke opslag krijgt het projectscherm de nieuwe tekst door, zodat bij terugkeer op het tabblad altijd de laatst getypte tekst staat.
4. **Duidelijke terugkoppeling** — een klein tekstje bij het vak toont "Opslaan…" en "Opgeslagen", zodat de auditor ziet dat het goed staat. Mislukt het opslaan, dan volgt een melding en blijft de getypte tekst staan.
5. **Spraakinvoer** volgt dezelfde weg, zodat ook ingesproken tekst bewaard blijft.

De correctie-registratie (logregel bij een al verstuurde bevinding) blijft werken, maar wordt hoogstens één keer per bewerkronde vastgelegd in plaats van bij elke automatische opslag.

## Technische details

- `src/components/FindingToelichting.tsx`: debounced autosave (~1000 ms) via `useEffect` + timer, flush in een cleanup bij unmount en in `onBlur`, `useRef` voor de laatst opgeslagen waarde om dubbele writes te voorkomen, statusindicator (`idle | saving | saved | error`), toast bij fout.
- Nieuwe prop `onSaved(findingId, toelichting)`; `src/pages/ProjectDetail.tsx` werkt daarmee `findings` bij (`setFindings(prev => prev.map(...))`), zodat `initialValue` bij remount actueel is.
- Correctielogging: alleen bij de eerste succesvolle opslag na een wijzigingsronde, niet per autosave-tick.
- Geen databasewijzigingen nodig.
