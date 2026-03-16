

## Plan: Upload vereisen bij "Niet akkoord" beoordeling

### Concept
Tekenaar/auditor kan bij het afkeuren van een reactie (FindingBeoordeling) afdwingen dat de EP-adviseur een document moet uploaden. De EP-adviseur kan dan niet simpelweg op "Accepteren" klikken zonder bewijs.

### Wijzigingen

#### 1. Database: kolom `upload_vereist` op findings
- Nieuwe `boolean` kolom `upload_vereist` (default `false`) op `findings`

#### 2. `FindingBeoordeling.tsx` — Checkbox bij "Niet akkoord"
- Checkbox toevoegen: "Eis dat EP-adviseur extra documentatie uploadt"
- Bij `nietAkkoord()`: de finding updaten met `upload_vereist: true/false` op basis van checkbox-waarde

#### 3. `FindingReactie.tsx` — Upload afdwingen
- Bij laden finding: check `upload_vereist`
- Als `upload_vereist === true`:
  - Toon melding: "De beoordelaar vereist dat je een document uploadt bij je reactie"
  - Verberg de "Accepteren" knop (EP-adviseur moet inhoudelijk reageren met bijlage)
  - Bij "Niet akkoord" modus: bestand is verplicht (knop disabled zonder bestand)

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Kolom `upload_vereist` toevoegen |
| `src/pages/FindingBeoordeling.tsx` | Checkbox + logica bij niet akkoord |
| `src/pages/FindingReactie.tsx` | Accepteren blokkeren + upload verplichten als `upload_vereist` |

