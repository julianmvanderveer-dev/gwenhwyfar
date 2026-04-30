## Antwoord op je vraag

**"Heeft een tekenaar gereageerd op de reactie van de EP-adviseur?"**
In de database zie ik op project *Bruggenhoofd Nijkerk* alleen berichten van **Rob Harbers (EP-adviseur)** met "Afwijking geaccepteerd" (24-04-2026). Er staan **geen reacties van een tekenaar of auditor terug**. Dat verklaart waarom het project nog op `wacht_op_reactie` staat: de bal ligt feitelijk weer bij intern (auditor moet de adviseurreactie beoordelen).

Op dit moment is dit alleen zichtbaar door per bevinding de berichtenhistorie open te klikken — er is nergens een centraal overzicht "bij wie ligt het". Dat gaan we toevoegen.

## Plan: Beheer-paneel "Stand van zaken" op ProjectDetail

Aan de bovenkant van `ProjectDetail.tsx` (alleen zichtbaar voor rol **beheer**) komt één compact paneel met drie blokjes naast elkaar.

### 1. Bij wie ligt het nu?
Eén regel per partij met aantal openstaande items:

```
Auditor/Tekenaar   3 reacties te beoordelen     (laatste actie: 24-04, EP-adviseur)
EP-adviseur        7 bevindingen open           (deadline: 11-05, T-11d)
Beheer             —
```

Logica:
- **Bij intern** = aantal findings met `status = 'reactie_ontvangen'` (adviseur heeft gereageerd, wacht op auditor/tekenaar).
- **Bij EP-adviseur** = aantal findings met `status = 'open'` én `zichtbaar_voor_adviseur = true`, zolang `project.status = 'wacht_op_reactie'`.
- **Toegewezen aan** = naam uit `projects.toegewezen_aan` (profielnaam) + rol.
- Reactiedeadline + tier (T-1d / overdue 1w / 2w / 3w) op basis van bestaande `reminder_*_sent` flags en `reactie_deadline`.

### 2. Laatste activiteit (max 5 regels)
Chronologische strip, nieuwste eerst, gebaseerd op `messages` van dit project:

```
24-04 13:55  Rob Harbers (EP-adviseur)   "Afwijking geaccepteerd"        bevinding 1c
24-04 13:54  Rob Harbers (EP-adviseur)   "Afwijking geaccepteerd"        bevinding 1d
17-04 09:12  Jan de Vries (Auditor)      Bevinding gemarkeerd Niet goed  bevinding 4a
...
```

Elke regel klikbaar → springt naar de tab van de betreffende bevinding.

Per regel laten we de rol zien door `messages.afzender_id` te joinen met `user_roles`. Voor "stille" acties (goedkeuring, status­wijziging zonder bericht) tonen we ook `findings.goedgekeurd_op` als activiteit.

### 3. Status & deadline
Compacte regel: `Status: Reactie EP-adviseur gevraagd · Deadline: 11-05-2026 (over 11 dagen)` met de huidige escalatie-tier (groen/oranje/rood).

### Visueel
Eén `Card` boven het bestaande "Aandachtspunten adviseur" blok, met drie kolommen (op desktop). Houd het minimalistisch — geen extra tabs, geen extra pagina. Alleen zichtbaar voor `hasRole("beheer")`.

## Technische details

**Nieuw component**: `src/components/projecten/BeheerStandVanZaken.tsx`
- Props: `project`, `findings`
- Eigen query: laatste 5 messages voor dit project (join `findings` op `project_id`, join `profiles` + `user_roles` voor naam/rol).
- Eigen query: profielnaam van `project.toegewezen_aan`.
- Berekent tier uit `reactie_deadline` + huidige tijd (T-1, T+7, T+14, T+21).

**Wijziging in `ProjectDetail.tsx`**: één regel toevoegen direct onder de header:
```tsx
{hasRole("beheer") && <BeheerStandVanZaken project={project} findings={findings} />}
```

**Geen DB-wijzigingen nodig** — alle benodigde data zit al in `messages`, `findings`, `projects`, `profiles`, `user_roles`.

## Wat NIET in dit plan zit
- Geen verandering aan workflow/statussen.
- Geen aanpassing aan herinneringsmails.
- Geen volledige audit trail-pagina (te ingewikkeld) — alleen laatste 5 acties.
