## Probleem
Bij handmatig kiezen van 'Goed' op een rij die nog geen bestaande bevinding heeft, blijft de status `open` in plaats van `gesloten`.

## Oorzaak
In `src/pages/ProjectDetail.tsx` werkt `handleBeoordeling` zo:
1. `ensureFinding(row)` maakt — als er nog geen finding is — een nieuwe rij in de tabel met default status `open`. De lokale `findings`-state wordt hierbij nog niet ververst.
2. Direct daarna roept `updateBeoordeling(fId, "goed")` aan, en daar zoekt `findings.find((f) => f.id === findingId)` de bevinding op om te bepalen of de status mee mag wijzigen.
3. Voor een net aangemaakte rij vindt die lookup niets → `huidig` is `undefined` → het hele status-blok wordt overgeslagen → status blijft `open`.

Dit raakt alleen rijen die voor het eerst beoordeeld worden. Bestaande bevindingen werken wel goed.

## Oplossing
`updateBeoordeling` aanpassen zodat het ook werkt voor net aangemaakte findings. Concreet: als `huidig` niet in de lokale state zit, behandelen als "nieuw, dus zeker niet zichtbaar voor adviseur" en dezelfde status-logica toepassen:

- `goed` → `status = "gesloten"`
- `niet_goed` / `opmerking` → `status = "open"` (al de default, maar expliciet zetten kan geen kwaad)
- `nvt` → status onveranderd laten

Alternatief overwogen: een `loadFindings()` toevoegen direct na `ensureFinding`. Niet gekozen omdat dat een extra round-trip is en alsnog een race-condition open laat tussen de fetch en het volgende `updateBeoordeling`.

## Wijziging
Eén bestand: `src/pages/ProjectDetail.tsx`, functie `updateBeoordeling`. De conditie `if (huidig && !huidig.zichtbaar_voor_adviseur)` wordt `if (!huidig || !huidig.zichtbaar_voor_adviseur)`, met behoud van de bestaande inhoud (inclusief de eerder toegevoegde `nvt`-uitzondering).

## Validatie
- Nieuwe checklist-rij → 'Goed' kiezen → status wordt direct `gesloten` (groen).
- Nieuwe rij → 'Niet goed' / 'Opmerking' → status `open`.
- Nieuwe rij → 'N.V.T.' → status blijft default `open` zonder verdere impact.
- Bestaande bevindingen die al naar de EP-adviseur zijn (`zichtbaar_voor_adviseur=true`) blijven ongewijzigd qua status.
