## Probleem

Na het verzenden van reacties via "Alle reacties nu versturen" in het afwijkingen-overzicht (EP-adviseur dashboard) blijft "Concept opgeslagen" zichtbaar. De database is wel correct bijgewerkt (`status = reactie_ontvangen`, `concept_reactie = null`), maar de React-state in `Inbox.tsx` wordt niet opnieuw geladen na de batch-verzending. De `BatchVersturenCompact` herlaadt alleen zijn eigen interne data, niet de lijst die `AdviseurSectie` toont.

De blokkade van bewerken na verzending werkt al correct: `FindingReactie.tsx` toont geen reactieformulier meer wanneer `status === "reactie_ontvangen"` (alleen leesweergave). Ook `AdviseurSectie` toont in de actie-kolom al "Ingediend" zodra status niet meer `open` is. Het enige dat ontbreekt is de refresh.

## Wijzigingen

### 1. `src/pages/Inbox.tsx`
- Geef `loadAdviseurData` als `onAdviseurDataChanged` prop door aan `AdviseurSectie`.

### 2. `src/components/dashboard/AdviseurSectie.tsx`
- Accepteer nieuwe optionele prop `onAdviseurDataChanged?: () => void`.
- Geef die door als `onSent` aan `BatchVersturenCompact` (naast bestaande `navigateOnSent={false}`).

### 3. Geen wijziging nodig in
- `BatchVersturenCompact` — roept `onSent?.()` al aan na succesvol versturen.
- `useBatchVersturen` — werkt status en concept_reactie al correct bij in de database.
- `FindingReactie.tsx` — blokkeert bewerken al wanneer status `reactie_ontvangen` of `reactie_goedgekeurd` is.

## Resultaat

Direct na klikken op "Alle reacties nu versturen":
- De adviseur-findings worden opnieuw geladen.
- Status-badge toont "Reactie ingediend" in plaats van "Concept opgeslagen".
- Actiekolom toont "Ingediend" (geen Wijzigen/Reageren link meer).
- De EP-adviseur kan de reactie niet meer openen voor wijziging totdat de auditor heropent.
