## Doel

In `AdviseurSectie` (EP-adviseur afwijkingen-overzicht):
1. Standaard alleen projecten tonen — findings worden pas zichtbaar bij klik op een project (uitklap).
2. Per project een knop "Alle reacties nu versturen" zichtbaar maken zodra alle concepten klaar zijn (zelfde logica als `BatchVersturenCompact`).

## Aanpak

### `src/components/dashboard/AdviseurSectie.tsx`

- Findings groeperen per `project_id` (en `projectnaam`) i.p.v. één lange tabel.
- Eén rij per project (collapsible), met:
  - Projectnaam (link naar `/project/:id` blijft beschikbaar via aparte knop "Audit inzien").
  - Aantal afwijkingen + status-telling ("3 open · 1 concept · 2 ingediend").
  - Chevron-knop om de details (de bestaande tabel met controlepunt/status/etc.) uit/in te klappen.
  - Verzendbalk via `BatchVersturenCompact` (`projectId={projectId}` `navigateOnSent={false}`) onder de uitgeklapte tabel **en** ook zichtbaar in ingeklapte staat, zodat de adviseur niets hoeft uit te klappen om te versturen.
- Lokale state `expanded: Record<string, boolean>` voor de uitklap. Standaard alles ingeklapt.
- Bestaande filters (project / status) blijven werken: ze filteren de findings vóór groeperen; een project met 0 zichtbare findings wordt verborgen.
- "Mijn projecten"-blokje onderaan blijft staan (apart overzicht van toegewezen projecten, ook zonder findings).

### Hergebruik

- `BatchVersturenCompact` rendert zelf null als er niets te versturen valt en toont anders teller + knop. Geen wijziging nodig in dat component.

## Buiten scope

- Geen wijzigingen aan filters/queries in `Inbox.tsx` (data blijft hetzelfde).
- Geen wijziging aan auditor-zijde of project-detail.
- Geen aparte concept-statusfilter (eerder al bewust achterwege gelaten).
