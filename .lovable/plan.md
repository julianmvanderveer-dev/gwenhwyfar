

## Fix: Projecten blijven toegewezen na claimen

### Probleem
Project "Fam. Oliebakker" heeft status `wacht_op_reactie` maar `toegewezen_aan` is NULL. Hierdoor verschijnt het in "Beschikbaar in pool" in plaats van "Aan mij toegewezen".

**Oorzaak**: De `claim_project` database-functie werkt alleen bij status `nog_niet_begonnen`. Wanneer een tekenaar een project bewerkt en de status verandert (bijv. naar `deel1_bezig`, `wacht_op_reactie`), maar het claimen niet lukte of niet werd getriggerd, blijft `toegewezen_aan` NULL.

Daarnaast claimt de auditor-flow helemaal geen projecten — bij `autoSetStatus` voor auditor (regel 73-75 in ProjectDetail.tsx) wordt alleen de status gewijzigd maar `toegewezen_aan` niet gezet.

### Oplossing

#### 1. Database: `claim_project` functie uitbreiden
Verwijder de status-restrictie zodat pool-projecten altijd geclaimd kunnen worden, ongeacht hun status:

```sql
UPDATE public.projects
SET toegewezen_aan = _user_id, toegewezen_op = now()
WHERE id = _project_id
  AND toegewezen_aan IS NULL
  AND toewijzing = 'pool';
-- Verwijder: AND status = 'nog_niet_begonnen'
```

#### 2. `ProjectDetail.tsx`: Auditor claimt ook pool-projecten
In de auditor-branch van `autoSetStatus` (regel 73-75): voeg dezelfde claim-logica toe als bij de tekenaar, zodat de auditor bij het openen van een pool-project ook `toegewezen_aan` krijgt.

#### 3. Data fix: "Fam. Oliebakker" corrigeren
Update het project zodat `toegewezen_aan` wordt gezet op de tekenaar die eraan werkte.

#### 4. `MedewerkerDashboard.tsx`: Vangnet-filter
Als extra veiligheid: projecten met een status die wijst op actief werk (`deel1_bezig`, `deel1_afgerond`, `deel2_bezig`, `wacht_op_reactie`) maar zonder `toegewezen_aan`, tonen als "Aan mij toegewezen" als het project via RLS zichtbaar is (RLS laat alleen eigen projecten of pool-projecten door).

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `claim_project` functie aanpassen |
| `src/pages/ProjectDetail.tsx` | Auditor claim-logica toevoegen |
| `src/components/dashboard/MedewerkerDashboard.tsx` | Vangnet-filter voor projecten zonder `toegewezen_aan` maar met actieve status |

