

## Plan: EP-adviseur overzicht herontwerpen

### Huidige situatie
De EP-adviseur ziet projecten als **aparte tabbladen**, met per project een tabel van findings. Statussen zijn beperkt tot `open`, `reactie_ontvangen` en `gesloten`.

### Gewenste situatie
Eén **platte tabel** met alle afwijkingen over alle projecten heen, met filters en duidelijke statuslabels.

---

### Wijzigingen

#### 1. Database: nieuw enum-waarde + kolom

- Voeg `reactie_goedgekeurd` toe aan `finding_status` enum
- Voeg kolom `goedgekeurd_op` (timestamptz, nullable) toe aan `findings` — voor de 7-dagen zichtbaarheid

#### 2. FindingBeoordeling.tsx — "Akkoord" zet nieuwe status

- Bij akkoord: status → `reactie_goedgekeurd` (i.p.v. `gesloten`), `goedgekeurd_op` → `now()`
- De `check_all_findings_closed` trigger moet ook `reactie_goedgekeurd` als "klaar" beschouwen

#### 3. Inbox.tsx — EP-adviseur sectie vervangen

**Weg**: tabbladen per project
**Nieuw**: één tabel met alle findings, kolommen:
| Projectnaam | Controlepunt | Type afwijking | Status | Reactie | Document | Actie |

**Statuslabels** (afgeleid):
- `open` → "Open" (oranje badge)
- `reactie_ontvangen` → "Geaccepteerd" of "Niet geaccepteerd" (bepaald via laatste bericht)
- `reactie_goedgekeurd` → "Reactie goedgekeurd" (groene badge)

**Filters**: dropdown per project en per status

**7-dagen regel**: findings met status `reactie_goedgekeurd` waarbij `goedgekeurd_op` > 7 dagen geleden worden uitgefilterd

#### 4. Query aanpassing in loadAdviseurData

- Haal alle findings op (niet alleen `!= gesloten`) maar filter op:
  - `status IN (open, reactie_ontvangen, reactie_goedgekeurd)`
  - `reactie_goedgekeurd` alleen als `goedgekeurd_op` < 7 dagen geleden
- Join met projects voor projectnaam
- Join met messages voor laatste reactie-tekst en bijlage

#### 5. check_all_findings_closed trigger updaten

- Trigger moet `reactie_goedgekeurd` ook als "klaar" meenemen bij het bepalen of alle findings van een project zijn afgehandeld

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Enum uitbreiden + `goedgekeurd_op` kolom + trigger updaten |
| `src/pages/Inbox.tsx` | EP-adviseur sectie: tabs → platte tabel met filters |
| `src/pages/FindingBeoordeling.tsx` | Akkoord → `reactie_goedgekeurd` + `goedgekeurd_op` |
| `src/lib/badges.tsx` | Nieuwe status badge `reactie_goedgekeurd` |

