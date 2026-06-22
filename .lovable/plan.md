## Probleem

`BatchVersturenCompact` laadt project + findings één keer bij mount. Wanneer `FindingReactie` een `concept_reactie` opslaat, weet de balk dat niet → teller blijft `0/1` en knop blijft disabled tot je weg/terug navigeert. Daarnaast vereist accepteren nu twee klikken.

## Wijzigingen

### 1. `src/components/projecten/BatchVersturenCompact.tsx`
- Nieuwe prop `refreshSignal?: number` toevoegen aan `Props`.
- `refreshSignal` opnemen in de dependency-array van het bestaande `useEffect` (naast `projectId` en `reloadKey`). Geen verdere logica nodig — bij elke bump worden project + findings opnieuw opgehaald, en daarmee ook `adviseurConcepten` / `adviseurKlaar` / disabled-state.

### 2. `src/pages/FindingReactie.tsx`
- `const [refreshSignal, setRefreshSignal] = useState(0);`
- Na een succesvolle DB-update in `accepteren`, `nietAkkoord` en `verstuurAaanvulling`: `setRefreshSignal(k => k + 1)` (naast bestaande `loadFinding()` / `loadMessages()`).
- `<BatchVersturenCompact projectId={finding.project_id} refreshSignal={refreshSignal} />`.

Hiermee verdwijnt bug 1 en 2: zodra een reactie is opgeslagen, herladen project + findings binnen de balk; teller springt naar `X/Y` en de verzendknop wordt enabled — zonder page reload of terug-navigeren.

### 3. Eén-klik accepteren (bug 3)
In `src/pages/FindingReactie.tsx`, in het blok `modus === "keuze"`:
- Wanneer `(finding as any).upload_vereist` **false** is: de "Accepteren" `Button` mag niet meer `setModus("akkoord")` aanroepen, maar moet direct `accepteren()` uitvoeren (met `akkoordToelichting` leeg). Eén klik = concept opgeslagen + balk geüpdatet.
- Extra kleine secundaire link "Toelichting toevoegen" eronder die `setModus("akkoord")` doet, zodat gebruikers die wél een toelichting willen geven dat nog kunnen (huidige flow blijft beschikbaar).
- Bij `isAkkoord` (reactie al opgeslagen) blijft de knop tekst "Wijzig: geaccepteerd" en gedraagt zich als vandaag (opent het toelichting-scherm). Niet akkoord blijft een tweestapsflow, want daar is een verplichte tekstreactie nodig.

Wanneer `upload_vereist` **true** is: gedrag ongewijzigd (document moet eerst worden gekozen).

## Niet gewijzigd

- `useBatchVersturen` logica.
- RLS / DB schema / triggers / e-mailflows.
- Niet-akkoord flow (vereist tekstinvoer, blijft tweestaps).
- Geen realtime subscription — een lichte refresh-signaal prop is voldoende en goedkoper dan een Supabase channel per bevinding.
