

# Fix: Inbox toont geen projecten/findings voor tekenaar, auditor en EP-adviseur

## Probleem
De Inbox-pagina filtert projecten te strikt op status, waardoor projecten niet zichtbaar zijn voor de verschillende rollen:

- **Auditor**: ziet alleen projecten met status `wacht_op_deel2` of `afgerond` — maar als een project status `reactie_open` heeft (na het versturen naar de adviseur), verdwijnt het uit beeld.
- **Tekenaar**: ziet alleen `geselecteerd` of `deel1_bezig` — mist projecten in latere fases.
- **EP-adviseur**: filtert op `status = reactie_open` EN findings met `status = open` EN `zichtbaar_voor_adviseur = true` — als één van deze condities niet klopt, ziet de adviseur niets.

Het resultaat is dat alle drie de rollen "Geen openstaande items" zien.

## Oplossing

### Bestand: `src/pages/Inbox.tsx`

**Statusfilters verruimen:**
- **Tekenaar** (zonder beheer): alle projecten behalve `gesloten` tonen (in plaats van alleen `geselecteerd`/`deel1_bezig`)
- **Auditor** (zonder beheer): alle projecten behalve `gesloten` tonen (in plaats van alleen `wacht_op_deel2`/`afgerond`)  
- **EP-adviseur**: projecten niet beperken tot alleen `reactie_open` — ook `afgerond` tonen zodat adviseurs hun complete projecten kunnen inzien. Findings-filter versoepelen: niet alleen `status = open`, maar alle niet-gesloten findings tonen.

**Concreet:**
1. `loadInternalData`: voor tekenaar en auditor (zonder beheer) dezelfde filter als beheer gebruiken: `neq("status", "gesloten")`
2. `loadAdviseurData`: projecten niet filteren op `reactie_open` maar op `neq("status", "gesloten")`. Findings laden zonder `status = open` filter, zodat alle zichtbare findings getoond worden.
3. De findings-query voor "te beoordelen" (tekenaar/auditor) behouden zoals deze is — die is specifiek voor `reactie_ontvangen`.

