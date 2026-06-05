## Probleem

In het EP-adviseur afwijkingen-overzicht (`AdviseurSectie`) wordt de status van een bevinding direct uit `findings.status` getoond. Die wisselt pas naar `reactie_ontvangen` ná het batch-versturen. Een opgeslagen **concept-reactie** verandert de DB-status niet, dus zo'n bevinding blijft "Open" — terwijl de adviseur al heeft gereageerd.

## Voorstel

Geen DB-wijzigingen. Tonen dat er een concept klaar staat op basis van `concept_reactie` (al meegeladen via `select("*")`).

1. **`src/pages/Inbox.tsx`** — `adviseurStatusBadge`:
   - Functie tweede argument geven: `hasConcept: boolean`.
   - Wanneer `status === "open"` én `hasConcept` → label **"Concept opgeslagen"** met een neutrale/blauwe stijl (bv. `bg-blue-50 text-blue-700 border border-blue-200`), zodat het visueel verschilt van "Reactie ingediend" (= definitief verzonden).
   - Type van prop `adviseurStatusBadge` in `AdviseurSectieProps` aanpassen.

2. **`src/components/dashboard/AdviseurSectie.tsx`**:
   - Aanroep wijzigen naar `adviseurStatusBadge(f.status, !!(f as any).concept_reactie)`.
   - Actiekolom: wanneer `status === "open"` én er is een concept → linktekst "Wijzigen" i.p.v. "Reageren" (zelfde target `/finding/:id/reactie`). Geen `Ingediend`-badge voor concepten — die blijft voorbehouden aan echt verzonden reacties.

3. **Statusfilter** (`bg-muted` selectopties): optioneel een extra optie "Concept opgeslagen" — laten we voor nu **niet** toevoegen (out of scope; de filter werkt op DB-status, en toevoegen vereist een aangepaste filterfunctie). Vermelden in plan zodat duidelijk is dat het bewust achterblijft.

## Buiten scope

- Geen DB-/RLS-/triggerwijzigingen, geen aparte tussenstatus in `findings.status`.
- Geen wijziging aan de auditor-zijde of `ProjectDetail`.
- Statusfilter-optie voor concepten niet toegevoegd.
