

# Spraaktool verbeteren + visuele feedback

## Problemen

1. **Geen visuele feedback** — De knop pulst alleen rood, maar er is geen geluidsgolf/volume-indicator die bevestigt dat audio daadwerkelijk wordt opgepikt.
2. **Browser SpeechRecognition beperkingen** — De Web Speech API werkt alleen in Chromium-browsers, vereist een actieve internetverbinding, en kan stilzwijgend falen zonder foutmelding.
3. **Geen foutmeldingen** — Als spraakherkenning faalt (geen microfoon-toestemming, niet-ondersteunde browser) ziet de gebruiker niets.

## Oplossing

### 1. Audio-visualisatie toevoegen
Een nieuw component `AudioVisualizer` dat via de Web Audio API (`AudioContext` + `AnalyserNode`) de microfoon-input uitleest en realtime geluidsgolven toont als geanimeerde balkjes naast de microfoonknop. Dit geeft directe visuele bevestiging dat audio wordt opgepikt.

### 2. Betere foutafhandeling
- Toast-melding bij geen microfoon-toestemming
- Toast bij niet-ondersteunde browser
- Visuele status-indicator (idle / luistert / fout)

### 3. Interim-resultaten tonen
`interimResults` op `true` zetten zodat de gebruiker live tekst ziet verschijnen terwijl hij praat — dit bevestigt dat de spraakherkenning werkt.

## Bestanden

| Bestand | Wijziging |
|---|---|
| `src/components/AudioVisualizer.tsx` | **Nieuw** — Geanimeerde geluidsgolf-balkjes op basis van `AnalyserNode` |
| `src/hooks/useSpeechRecognition.ts` | Microfoon-toestemming vragen + `AudioContext` opzetten voor visualisatie, `interimResults: true`, betere foutmeldingen |
| `src/components/FindingToelichting.tsx` | `AudioVisualizer` tonen tijdens opname |
| `src/pages/FindingBeoordeling.tsx` | Idem: visualizer toevoegen bij de spraakknop |

## Technisch

- `useSpeechRecognition` retourneert extra: `analyserNode` (voor visualizer) en `interimText` (live preview)
- `AudioVisualizer` gebruikt `requestAnimationFrame` + `canvas` of CSS-balkjes om frequentiedata te tekenen
- Bij toggle-start: `navigator.mediaDevices.getUserMedia({ audio: true })` → `AudioContext` → `createAnalyser()` → stream koppelen
- Bij stop: stream tracks stoppen, context sluiten
- Geen externe dependencies nodig

