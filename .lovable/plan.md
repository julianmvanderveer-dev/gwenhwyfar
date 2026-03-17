

## Plan: Finding toewijzen aan specifieke medewerker

### Probleem
Momenteel wordt `eigenaar_beoordeling` ingesteld als rol ("tekenaar" of "auditor"), waardoor **alle** tekenaars of auditors de reactie zien. De finding moet worden toegewezen aan de **specifieke persoon** die de afwijking heeft geconstateerd.

### Aanpak

#### 1. Database: nieuw veld `toegewezen_beoordelaar` op `findings`
```sql
ALTER TABLE public.findings 
  ADD COLUMN toegewezen_beoordelaar uuid REFERENCES profiles(id);
```
Dit veld bevat de user_id van de specifieke medewerker die de finding moet beoordelen.

#### 2. Finding aanmaken/beoordelen: user_id meesturen
In `src/pages/ProjectDetail.tsx` bij `updateBeoordeling`: naast `eigenaar_beoordeling` ook `toegewezen_beoordelaar: user.id` opslaan. Zo wordt de huidige ingelogde gebruiker (de tekenaar of auditor die de fout constateert) direct gekoppeld.

#### 3. Inbox filteren op specifieke gebruiker
In `src/pages/Inbox.tsx` en `src/components/dashboard/MedewerkerDashboard.tsx`: de query wijzigen van `.eq("eigenaar_beoordeling", eigenaar)` naar `.eq("toegewezen_beoordelaar", user.id)`. Zo ziet alleen de specifieke medewerker de reactie.

#### 4. Beheer kan hertoewijzen (bestaande functionaliteit)
Beheerders kunnen via de bestaande FindingBeoordeling-pagina of een klein extra veld de `toegewezen_beoordelaar` wijzigen naar een andere medewerker. Dit kan als een simpele hertoewijzing-optie op de beoordelingspagina.

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `toegewezen_beoordelaar uuid` kolom toevoegen aan `findings` |
| `src/pages/ProjectDetail.tsx` | Bij beoordeling `toegewezen_beoordelaar: user.id` meesturen |
| `src/pages/Inbox.tsx` | Filter findings op `toegewezen_beoordelaar = user.id` i.p.v. rol |
| `src/components/dashboard/MedewerkerDashboard.tsx` | Idem: filter op `toegewezen_beoordelaar` |
| `src/pages/FindingBeoordeling.tsx` | Optie voor beheer om beoordelaar te hertoewijzen |

