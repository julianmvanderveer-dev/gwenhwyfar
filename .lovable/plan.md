## Probleem
De tekenaar kan de EP2-berekening (startwaarde) niet meer aanpassen zodra deel 1 op "afgerond" staat, ook niet als de auditor het project nog niet heeft opgepakt. In de praktijk wil je dat de tekenaar correcties kan blijven doen totdat de auditor daadwerkelijk aan deel 2 begint.

## Voorstel
Eén regel logica in `src/pages/ProjectDetail.tsx` uitbreiden zodat de tekenaar de EP2-startwaarde (en eventueel andere deel‑1 invoer) mag bewerken zolang de auditor nog niet bezig is met deel 2.

### Wijziging
- Nieuwe afgeleide variabele:
  `canEditDeel1Berekening = (tekenaar||auditor) && status ∈ {nog_niet_begonnen, deel1_bezig, deel1_afgerond}`
  (auditor mag uiteraard ook in deel2_bezig, dat valt al onder `canDeel2`.)
- `Startwaarde EP2` input gebruikt `disabled={!(canEditDeel1Berekening || canDeel2)}` i.p.v. de huidige check.
- Toelichting onder het paneel: "Je kunt de startwaarde nog aanpassen totdat de auditor met deel 2 begint."

### Scope (bewust beperkt)
- Alleen de **EP2-startwaarde**. Eindwaarde en beoordeling blijven exclusief voor de auditor in deel 2.
- Geen wijziging aan findings/checklist; correctiemodus daarvoor bestaat al apart.
- Geen DB-/RLS-wijziging nodig: de bestaande policies staan updates door tekenaar/auditor al toe; dit is puur een UI-grendel.

### Optioneel (laat me weten of je dit ook wilt)
Zelfde verruiming toepassen op alle deel‑1 checklist‑invoer in `deel1_afgerond`, zodat de tekenaar het hele deel 1 nog kan corrigeren tot de auditor effectief overneemt.