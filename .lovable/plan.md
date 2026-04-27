## Plan: beoordelingsscherm vereenvoudigen + auto-afronden bij geaccepteerde afwijking

### Probleem
Wanneer de Auditor een ontvangen reactie opent, krijgt hij altijd dezelfde acties:
- Opmerking + spraakinvoer
- Optie "Eis extra documentatie"
- Hertoewijzen (beheer)
- Doorzetten naar tekenaar
- Akkoord / Niet akkoord

Dat is verwarrend. Bovendien: als de EP-adviseur de afwijking simpelweg **accepteert**, hoeft de auditor er meestal helemaal niets meer mee — er is immers geen discussie en geen herziene berekening die naar een tekenaar moet.

### Nieuwe logica

**Bepalen of adviseur akkoord ging**
De EP-adviseur stuurt bij accepteren altijd het bericht `"Afwijking geaccepteerd"` (zie `FindingReactie.tsx`, functie `accepteren`). Bij niet-akkoord stuurt hij eigen tekst, eventueel met bijlage. We detecteren in `FindingBeoordeling.tsx` of er minimaal één adviseur-bericht is met exact die tekst.

**Twee scenario's:**

#### Scenario A — Adviseur heeft afwijking geaccepteerd
Auto-afronden zónder tussenkomst, **tenzij**:
1. `upload_vereist = true` op de bevinding (er is om documentatie gevraagd), OF
2. de bevinding is `KT` (kritiek, `type_afwijking = 'kritiek'`)

Als geen van beide geldt:
- De finding wordt automatisch op `reactie_goedgekeurd` gezet bij het openen.
- De auditor ziet een groene bevestigingskaart: **"Afwijking geaccepteerd door EP-adviseur — automatisch afgesloten"**, met een korte uitleg waarom geen actie nodig is.
- Geen actieknoppen meer.

Als wel KT óf upload vereist was:
- Toon melding: **"De EP-adviseur heeft de afwijking geaccepteerd, maar deze is kritiek / vereiste documentatie. Beoordeling door auditor blijft nodig."**
- Volledig beoordelingsblok wordt getoond (zie scenario B).

#### Scenario B — Adviseur is niet akkoord (of onduidelijk)
Toon het bestaande beoordelingsblok, maar **vereenvoudigd**:
- Primaire actie: **Reactie goedkeuren** (groot, primair) — sluit bevinding af.
- Secundaire actie: **Niet akkoord** (outline) — heropent de bevinding.
- Optie "Eis extra documentatie" alleen tonen bij keuze "Niet akkoord" (vouwt open onder die knop, in plaats van als losse checkbox bovenaan).
- Opmerking + spraakinvoer alleen tonen bij "Niet akkoord".

#### "Doorzetten naar tekenaar" verplaatsen
Niet meer standaard zichtbaar. Wordt verborgen achter een uitklapbare/secundaire link **"Andere acties"** onderaan, met daarin:
- Doorzetten naar tekenaar (alleen auditor)
- Beoordelaar hertoewijzen (alleen beheer)

Reden: deze acties zijn uitzonderingen, geen standaard workflow.

### Aanpassingen per bestand

**`src/pages/FindingBeoordeling.tsx`**
- Helper `adviseurHeeftGeaccepteerd()` toevoegen: scan `messages` op een bericht met `bericht === "Afwijking geaccepteerd"` afkomstig van `adviseurContext.user_id`.
- Helper `vereistAuditorActie()`: `true` als `finding.upload_vereist === true` OF `finding.type_afwijking === 'kritiek'`.
- In `useEffect` na het laden van finding + messages + adviseurContext: als geaccepteerd én geen auditoractie vereist én status is `reactie_ontvangen`, dan automatisch `update findings set status = 'reactie_goedgekeurd', goedgekeurd_op = now()`. Toon toast: "Bevinding automatisch afgesloten — adviseur ging akkoord."
- Render-logica:
  - Status `reactie_goedgekeurd` + adviseur akkoord ging → groene info-kaart "Afwijking geaccepteerd door EP-adviseur".
  - Status `reactie_ontvangen` + adviseur akkoord ging + auditoractie vereist → gele info-kaart met uitleg + beoordelingsblok.
  - Status `reactie_ontvangen` + adviseur niet akkoord → standaard beoordelingsblok.
- Beoordelingsblok herstructureren: knoppen **"Reactie goedkeuren"** (primair) en **"Niet akkoord"** (outline). Opmerking, spraak en checkbox "Eis extra documentatie" alleen tonen na klik op "Niet akkoord".
- Acties "Doorzetten naar tekenaar" en "Hertoewijzen" verplaatsen onder een collapsible **"Andere acties"** onderaan.

**Geen wijzigingen** in `FindingReactie.tsx`, schema, of overige bestanden nodig.

### Resultaat
- Default workflow voor de auditor: open scherm → de meeste geaccepteerde afwijkingen zijn al automatisch afgesloten en verschijnen niet meer in de inbox.
- Voor bevindingen waar wel actie nodig is, is er één duidelijke primaire keuze ("Reactie goedkeuren") en één alternatief ("Niet akkoord").
- Speciale gevallen (KT-bevinding waar adviseur akkoord ging, of waar documentatie vereist is) worden expliciet gemarkeerd zodat de auditor begrijpt waarom hij toch moet beoordelen.
- Doorzetten naar tekenaar blijft mogelijk maar staat niet meer in de hoofdflow.
