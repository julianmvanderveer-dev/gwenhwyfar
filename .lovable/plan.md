## Probleem

In het auditrapport tellen we nu alle `niet_goed`-bevindingen met status `reactie_goedgekeurd` of `gesloten` als "weerlegd". Maar dat klopt niet:

- **Inhoudelijk weerlegd** = de EP-adviseur heeft beargumenteerd dat het tóch goed is, en de auditor/tekenaar gaat daarin mee → de afwijking vervalt en mag niet meer als fout gelden.
- **Geaccepteerd** = de EP-adviseur erkent de fout ("Afwijking geaccepteerd") en de zaak wordt afgesloten → de fout blijft staan als terechte afwijking en hoort gewoon mee te tellen als open afwijking in het rapport.

Op dit moment worden beide gevallen samengevoegd onder "weerlegd", waardoor terecht geconstateerde fouten ten onrechte uit de openstaande lijst en de rode teller verdwijnen.

## Detectie van "geaccepteerd door adviseur"

In `FindingBeoordeling.tsx` wordt al gewerkt met dit signaal:

```ts
messages.some(m =>
  m.afzender_id === <adviseur user_id> &&
  m.bericht.trim() === "Afwijking geaccepteerd"
)
```

We hergebruiken dezelfde detectie in het rapport: een afgesloten `niet_goed`-bevinding waarbij de adviseur een message met exact "Afwijking geaccepteerd" heeft achtergelaten = **geaccepteerde fout** (telt als afwijking). Anders = **inhoudelijk weerlegd** (telt niet als afwijking).

## Wijzigingen

### 1. `src/pages/ProjectDetail.tsx`

Bij het ophalen van data voor het rapport ook ophalen:
- `messages` voor alle findings van dit project (`finding_id`, `afzender_id`, `bericht`)
- `adviseurs.user_id` van de gekoppelde adviseur (om afzender te matchen)

Doorgeven aan `generateAuditReport` als nieuwe velden `messages` en `adviseurUserId`.

### 2. `src/lib/generateAuditReport.ts`

- Nieuwe interface-velden: `messages?: { finding_id: string; afzender_id: string; bericht: string }[]` en `adviseurUserId?: string`.
- Helper `isAcceptedByAdviseur(findingId)`: true als er een message bestaat met `afzender_id === adviseurUserId` en `bericht.trim() === "Afwijking geaccepteerd"`.
- Herclassificatie van `niet_goed`-bevindingen in **drie** groepen:
  - **Open afwijking**: status NIET in `[reactie_goedgekeurd, gesloten]` → bestaande logica.
  - **Geaccepteerde afwijking** (NIEUW): status in `[reactie_goedgekeurd, gesloten]` EN `isAcceptedByAdviseur` = true. Telt mee als terechte fout.
  - **Weerlegd**: status in `[reactie_goedgekeurd, gesloten]` EN `isAcceptedByAdviseur` = false (= inhoudelijk weerlegd, fout vervalt).

### 3. Rapport-weergave

**Bovenaan ("Openstaande afwijkingen"-blok):**
- Hernoemen naar **"Afwijkingen"**.
- Bevat zowel openstaande als geaccepteerde afwijkingen samen, met een extra kolom of badge "Status afhandeling": `Open` / `Geaccepteerd door adviseur`.
- De grote teller bovenaan = `openAfwijkingCount + geaccepteerdCount`. Rood als > 0.
- Als beide 0: groene "Geen afwijkingen — alle 'niet goed'-bevindingen zijn inhoudelijk weerlegd" melding.

**Samenvatting-tabel (4 kolommen):**
- Goed (groen)
- Afwijking (rood als > 0) = open + geaccepteerd, samen
- Weerlegd (neutraal grijs) = alleen inhoudelijk weerlegd
- Opmerkingen (blauw)

Optioneel onder de afwijking-teller een klein bijschrift "waarvan X open, Y geaccepteerd" voor nuance, zonder visuele ruis toe te voegen.

## Resultaat

- Een fout die terecht was en door de adviseur is erkend, blijft zichtbaar bovenaan en telt mee in de rode teller — ook als de bevinding administratief is afgesloten.
- Alleen wanneer de adviseur inhoudelijk gelijk kreeg (geen "Afwijking geaccepteerd"-message, wel afgesloten/goedgekeurd), valt de fout uit de afwijkingen en verschijnt onder "Weerlegd".
