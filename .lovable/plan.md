## Achtergrond — wat verandert er?

Vandaag wordt elke reactie **direct individueel** verwerkt:
- EP-adviseur klikt per bevinding "Accepteren" of "Niet akkoord" → finding gaat meteen op `reactie_ontvangen`.
- Auditor klikt per bevinding "Goedkeuren" of "Niet akkoord" → finding gaat direct op `reactie_goedgekeurd` of terug naar `open`.

Dat maakt dat een project druppelsgewijs heen en weer gaat. We willen toe naar **batch-versturen**: pas als álle bevindingen zijn beantwoord, kun je ze in één keer versturen naar de andere partij.

## Nieuw gedrag

### EP-adviseur
1. Per openstaande bevinding kiest hij **Accepteren** of **Niet akkoord** (met onderbouwing + evt. bijlage). Dit wordt opgeslagen als **concept-reactie** — finding blijft op `status = 'open'`.
2. Onderaan het project ziet hij een teller: *"X van Y bevindingen beantwoord"*.
3. Knop **"Alle reacties versturen naar auditor"** wordt pas actief als X = Y.
4. Bij versturen: alle findings krijgen in één keer `status = 'reactie_ontvangen'`, projectstatus blijft `wacht_op_reactie` (of we maken het expliciet — zie technisch deel), en er gaat één notificatiemail naar de auditor.

### Auditor
1. Voor elke `reactie_ontvangen`-bevinding kiest hij **Goedkeuren** of **Niet akkoord** (toelichting + evt. upload-eis). Wordt opgeslagen als **concept-beoordeling** — finding blijft op `reactie_ontvangen`.
2. Onderaan: *"X van Y reacties beoordeeld"*.
3. Knop **"Alle beoordelingen versturen naar EP-adviseur"** pas actief bij volledig.
4. Bij versturen:
   - Goedgekeurde findings → `reactie_goedgekeurd`.
   - Afgekeurde findings → `open` (heropend), nieuwe `reactie_deadline` op project, alle reminder-flags reset.
   - Eén notificatiemail naar EP-adviseur als er heropende findings zijn.
   - Als alles goedgekeurd → trigger sluit project automatisch (bestaand gedrag).

### Auto-acceptatie blijft werken
Als adviseur "Akkoord" geeft op een niet-kritieke bevinding zonder uploadeis, mag hij die in zijn batch laten — auditor ziet ze als concept-goedgekeurd en hoeft alleen te bevestigen. Het bestaande `reactie_goedgekeurd`-automatisme verhuist van direct-bij-binnenkomst naar het verstuur-moment van de auditor.

## Technisch

### Datamodel
Twee nieuwe nullable kolommen op `findings`:

| Kolom | Type | Doel |
|---|---|---|
| `concept_reactie` | jsonb | `{ type: 'akkoord' \| 'niet_akkoord', bericht?: string, bijlage_pad?: string, opgeslagen_op: timestamptz }` — concept van EP-adviseur |
| `concept_beoordeling` | jsonb | `{ type: 'akkoord' \| 'niet_akkoord', toelichting?: string, upload_vereist?: boolean, opgeslagen_op: timestamptz }` — concept van auditor |

Bij het versturen wordt de jsonb omgezet naar een echte `messages`-rij + finding-statusupdate, en daarna leeggemaakt (`null`).

Geen enum-wijzigingen nodig.

### Bestanden

- **`src/pages/FindingReactie.tsx`** — `accepteren`/`nietAkkoord` schrijven naar `concept_reactie` i.p.v. direct messages + status. Toon banner "Concept opgeslagen — versturen via projectoverzicht".
- **`src/pages/FindingBeoordeling.tsx`** — `akkoord`/`nietAkkoord` schrijven naar `concept_beoordeling`. Auto-acceptatie-effect (regels 72-93) verplaatst de logica naar het concept i.p.v. directe statuswijziging.
- **`src/pages/ProjectDetail.tsx`** — Nieuw paneel "Batch versturen":
  - Voor EP-adviseur: teller open vs. concept; knop "Alle reacties versturen".
  - Voor auditor (bij projectstatus die reacties bevat): teller `reactie_ontvangen` vs. concept; knop "Alle beoordelingen versturen".
  - Verstuur-handlers doen één transactie: messages bulk-insert, findings bulk-update, project-update, notify-edge-function aanroepen.
- **`src/components/projecten/FaseTabel.tsx`** — Toon per rij badge "Concept opgeslagen" (geel) zodat je in de tabel ziet welke al klaar zijn.
- **`src/components/projecten/BeheerStandVanZaken.tsx`** — Aanpassen "bal ligt bij"-logica: als alle concepten gevuld → "Klaar om te versturen" (bal ligt nog steeds bij dezelfde partij maar met andere tint).

### Migratie
```sql
ALTER TABLE public.findings
  ADD COLUMN concept_reactie jsonb,
  ADD COLUMN concept_beoordeling jsonb;
```

### Notificaties
- `notify-adviseur` edge function blijft, wordt nog steeds eenmalig aangeroepen — nu alleen bij batch-verstuur (heropende findings) i.p.v. per "niet akkoord".
- Voor de andere richting (adviseur → auditor) gebruiken we de bestaande in-app `notificaties` tabel + één bericht "Reacties EP-adviseur ontvangen voor project X".

## Wat NIET in dit plan zit
- Geen wijziging aan deadlines/herinneringen (blijft 2 weken vanaf eerste verstuurmoment, reset bij heropenen).
- Geen wijziging aan correctie-modus voor auditor/tekenaar (blijft zoals het nu is).
- Geen wijziging aan de eerste keer dat de auditor de audit afrondt en findings naar de adviseur stuurt — dat is al een batch-actie.
