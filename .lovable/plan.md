

## Plan: Formulier vereenvoudigen en inspreekfunctie stabiliseren

### 1. "Kritiek / niet kritiek" kolom verwijderen

**`src/pages/ProjectDetail.tsx`**:
- Verwijder de "Type" kolom (header rij 628 + cel rij 679-691) uit de tabel
- In `updateBeoordeling`: verwijder de automatische toewijzing van `type_afwijking` bij "niet_goed" (regel 273)
- In `auditAfronden`: vereenvoudig de deadline-logica — alle "niet_goed" findings krijgen dezelfde deadline (3 maanden), geen onderscheid meer tussen kritiek/niet-kritiek (regels 342-357)
- EP2 beoordeling select: vereenvoudig naar alleen "Goed" en "Niet goed" (verwijder NK/KT opties, regels 807-809)

**`src/pages/FindingBeoordeling.tsx`**:
- Verwijder de "Type afwijking" regel uit het info-blok (regel 119)

**`src/lib/badges.tsx`**:
- `afwijkingBadge` functie kan blijven (backward compatible) maar wordt niet meer aangeroepen vanuit de tabel

**`src/lib/generateAuditReport.ts`**: verwijder type_afwijking referenties uit het rapport (indien aanwezig)

### 2. Deadline-kolom uit hoofdscherm halen

**`src/pages/ProjectDetail.tsx`**:
- Verwijder de "Deadline" header (regel 629) en de deadline-cel (regels 693-695) uit de tabel
- Deadline blijft intern bestaan en wordt nog steeds berekend bij `auditAfronden`, maar is niet meer zichtbaar in het audit-formulier
- Deadline blijft zichtbaar op de `FindingBeoordeling`-pagina (daar is het relevant)

### 3. Inspreekfunctie stabiliseren

**`src/hooks/useSpeechRecognition.ts`**:
- Probleem: `continuous = true` + `interimResults = false` kan ertoe leiden dat de browser de sessie afbreekt zonder duidelijke feedback
- Fix: voeg `recognition.onend` auto-restart toe wanneer de gebruiker nog aan het luisteren is (browser stopt soms na stilte)
- Voeg een ref bij om te voorkomen dat `onResult` wordt aangeroepen na handmatig stoppen
- Voeg een timeout toe (bijv. 60s) die de opname automatisch stopt met een toast-melding

### Overzicht tabelkolommen (na wijziging)

```text
Huidig:   Code | Controlepunt | [Uitdraai] | Deel | Beoordeling | Type | Deadline | Status
Nieuw:    Code | Controlepunt | [Uitdraai] | Deel | Beoordeling | Status
```

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | Verwijder Type + Deadline kolommen, vereenvoudig auditAfronden en updateBeoordeling, EP2 opties |
| `src/pages/FindingBeoordeling.tsx` | Verwijder type_afwijking uit info-blok |
| `src/hooks/useSpeechRecognition.ts` | Auto-restart bij onverwacht stoppen, timeout, stabielere state management |
| `src/lib/badges.tsx` | Geen wijziging nodig (backward compatible) |
| `src/lib/generateAuditReport.ts` | Verwijder type_afwijking referenties |

