

# Toelichtingsveld + spraakgestuurd invoeren per finding

## Wat wordt gebouwd
Een tekstveld ("toelichting") bij elk controlepunt in de projectdetailpagina, waar tekenaar/auditor kan beschrijven WAT de afwijking is. Daarnaast een microfoonknop voor spraak-naar-tekst via de ingebouwde browser Web Speech API (geen externe API of kosten nodig).

## Wijzigingen

### 1. Database: kolom `toelichting` toevoegen aan `findings`
- `ALTER TABLE findings ADD COLUMN toelichting text;` -- nullable, standaard leeg
- Geen RLS-wijzigingen nodig (bestaande update-policy dekt dit al)

### 2. ProjectDetail.tsx aanpassen
- Textarea toevoegen per finding-rij (zichtbaar wanneer beoordeling "niet_goed" of "interne_alert" is, of altijd indien gewenst)
- Opslaan via `supabase.from("findings").update({ toelichting })` met debounce of onBlur
- Microfoonknop (Mic icon) naast de textarea die de browser `SpeechRecognition` API start
  - Spraakresultaat wordt toegevoegd aan de bestaande tekst
  - Taal ingesteld op `nl-NL`
  - Visuele feedback: icoon wordt rood/pulserend tijdens opname

### 3. Spraakherkenning
- Gebruikt `window.SpeechRecognition` of `window.webkitSpeechRecognition` (ingebouwd in Chrome/Edge, gratis)
- Geen edge function of API-key nodig
- Fallback: knop verbergen als de browser het niet ondersteunt

## Technische details
- Web Speech API is puur client-side, geen kosten, geen setup
- De toelichting wordt opgeslagen als vrije tekst in de database
- Textarea is alleen bewerkbaar voor tekenaar (deel 1) of auditor (deel 2), conform bestaande `canEditFinding` logica

