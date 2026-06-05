## Voorstel
Verruim deel‑1 bewerken zodat tekenaar (en auditor) **alle** deel‑1 invoer kunnen blijven corrigeren tot de auditor met deel 2 begint — analoog aan wat we net voor EP2-startwaarde deden.

### Wijziging in `src/pages/ProjectDetail.tsx`
- `canDeel1` uitbreiden: status mag ook `deel1_afgerond` zijn:
  `(tekenaar||auditor) && status ∈ {nog_niet_begonnen, deel1_bezig, deel1_afgerond}`
- Effect (automatisch, via bestaande afgeleiden):
  - `canEditFindingByDeel(1)` → tekenaar/auditor mogen deel‑1 bevindingen toevoegen/wijzigen tijdens `deel1_afgerond`.
  - `canEditTemplate` voor deel‑1 templates idem.
  - `canEditAny` = true, dus relevante UI-knoppen blijven beschikbaar.
  - EP2-startwaarde-helperregel (`canEditStartwaarde`) kan vervallen; valt nu samen met `canDeel1`.
- `canDeel2` blijft ongewijzigd → auditor‑only voor deel 2 en EP2-eindwaarde/beoordeling.
- "Correctiemodus" (`canCorrectFinding`) blijft ongewijzigd; die regelt het na-verzenden corrigeren in latere fasen.

### Scope (bewust afgebakend)
- Alleen UI-grendel; geen DB/RLS-aanpassing nodig.
- Geen wijziging aan workflow-status: de tekenaar zet zelf nog steeds deel 1 op afgerond; status verandert pas zodra auditor deel 2 oppakt.
- Geen wijziging aan deel‑2 rechten.

### Risico's
- Tekenaar kan na "afronden" nog wijzigen → bewust. Auditor ziet dezelfde data zodra die deel 2 oppakt; geen race-condities want UI sluit `canDeel1` zodra status `deel2_bezig`/verder is.