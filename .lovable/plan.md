

# Spraak-naar-tekst toevoegen voor EP-adviseur en Auditor

## Probleem
De spraak-naar-tekst (microfoon) knop is alleen beschikbaar in `ProjectDetail.tsx` via het `FindingToelichting` component. De pagina's `FindingReactie.tsx` (EP-adviseur) en `FindingBeoordeling.tsx` (Auditor) gebruiken een gewone Textarea zonder spraakondersteuning.

## Oplossing

### 1. FindingReactie.tsx — EP-adviseur reactie
De Textarea op regel 108-113 uitbreiden met een microfoonknop naast het tekstveld. De `useSpeechRecognition` hook hergebruiken om spraak toe te voegen aan het `bericht` veld.

### 2. FindingBeoordeling.tsx — Auditor beoordeling
Hier is momenteel geen tekstveld voor een toelichting bij akkoord/niet-akkoord. Er kan een optioneel opmerkingenveldje worden toegevoegd met spraakondersteuning, óf als dat niet gewenst is, alleen de bestaande pagina's aanpassen.

### Aanpak
- In beide pagina's de `useSpeechRecognition` hook importeren
- Een microfoonknop naast de Textarea plaatsen (zelfde stijl als in `FindingToelichting`)
- Spraakresultaat toevoegen aan de huidige tekstinhoud

### Bestanden
- `src/pages/FindingReactie.tsx` — microfoonknop naast reactie-textarea
- `src/pages/FindingBeoordeling.tsx` — optioneel opmerkingenveld met spraak toevoegen (als gewenst)

