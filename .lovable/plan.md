
## Plan: beoordelingscontext + juiste status in projectenoverzicht

### Doel
De Auditor moet duidelijk zien waarop hij een reactie beoordeelt, én het projectenoverzicht mag niet meer zeggen “Reactie EP-adviseur gevraagd” zodra de EP-adviseur al op bevindingen heeft gereageerd.

### Aanpassing 1: beoordelingsscherm verduidelijken
In `src/pages/FindingBeoordeling.tsx` wordt het scherm voor het beoordelen van een reactie uitgebreid.

Dit wordt zichtbaar:
- Titel wijzigen naar **“Bevinding beoordelen”**.
- Een duidelijke kaart **“Originele bevinding”** met:
  - Onderdeel
  - Controlepunt
  - Beoordeling
  - Type afwijking
  - Originele toelichting
  - Deadline
  - Status
- Een kaart **“Communicatie over deze bevinding”** met alle berichten chronologisch.
- Per bericht:
  - Datum/tijd
  - Berichttekst
  - Indien aanwezig: knop **“Bijlage downloaden”**
- Onderaan een aparte sectie **“Beoordeling door Auditor”** met:
  - Opmerking
  - Optie om extra documentatie te eisen
  - Knoppen **Akkoord** en **Niet akkoord**

Technisch:
- `loadFinding()` wordt aangepast van `.single()` naar `.maybeSingle()`, volgens de projectstandaard.
- Bijlagen worden geopend via een tijdelijke signed URL uit de bestaande private opslag `finding-documents`.
- Geen databasewijzigingen nodig.

### Aanpassing 2: overzichtstatus aanpassen wanneer reactie binnen is
Het project zelf blijft in de database status `wacht_op_reactie`, maar in het overzicht wordt al visueel onderscheid gemaakt via `getProjectFase(project.status, hasReactieOntvangen)`.

De bestaande logica kent al:
- `wacht_op_reactie_ep`: **“Reactie EP-adviseur gevraagd”**
- `reactie_ontvangen`: **“Reactie ontvangen”**

Ik pas dit aan zodat de tekst duidelijker wordt wanneer de bal weer intern ligt.

Nieuwe labels:
- Als er nog geen reactie is:
  - **“Reactie EP-adviseur gevraagd”**
  - Omschrijving: **“Audit verzonden, wacht op reactie EP-adviseur.”**
- Als er wel minimaal één bevinding met `reactie_ontvangen` is:
  - **“Reactie ontvangen — beoordeling nodig”**
  - Omschrijving: **“EP-adviseur heeft gereageerd; Auditor of Tekenaar moet opvolgen.”**

### Aanpassing 3: medewerkerdashboard ook juiste tekst geven
In `src/components/dashboard/MedewerkerDashboard.tsx` staat nu bij projecten met `wacht_op_reactie` altijd:

```text
Reactie EP-adviseur gevraagd
```

Dat is verwarrend zodra er openstaande reacties bij de Auditor/Tekenaar liggen.

Ik pas de tekst daar aan naar een neutralere workflowtekst:
- Voor Auditor/Tekenaar:
  - **“Reacties beoordelen”** wanneer er openstaande bevindingen in de tab “Bevindingen” staan.
  - Anders blijft projectstatus **“Reactie EP-adviseur gevraagd”** alleen gebruikt voor projecten waar echt nog gewacht wordt op de adviseur.

Als de bestaande medewerkerprojectlijst onvoldoende finding-context heeft om dit per project exact te bepalen, voeg ik daar een lichte lookup toe op `findings` per project om te bepalen of er `reactie_ontvangen` aanwezig is.

### Aanpassing 4: gedeelde badges/statuslabels corrigeren
In `src/lib/badges.tsx` blijft de database-status `wacht_op_reactie` bestaan, maar de visuele tekst wordt waar nodig contextbewust gebruikt:
- Projectstatus zonder reactie: **“Reactie EP-adviseur gevraagd”**
- Project met ontvangen reacties: via fase/substatus **“Reactie ontvangen — beoordeling nodig”**
- Findingstatus `reactie_ontvangen`: **“Reactie ontvangen”**

### Bestanden
Te wijzigen:
- `src/pages/FindingBeoordeling.tsx`
- `src/components/projecten/faseConfig.ts`
- `src/components/dashboard/MedewerkerDashboard.tsx`
- mogelijk `src/lib/badges.tsx` voor consistente labels

### Resultaat
In het overzicht is direct duidelijk of er nog op de EP-adviseur wordt gewacht, of dat de volgende actie bij Auditor/Tekenaar ligt. Op de beoordelingspagina ziet de Auditor vervolgens de originele bevinding, alle communicatie en eventuele bijlagen voordat hij akkoord of niet akkoord geeft.
