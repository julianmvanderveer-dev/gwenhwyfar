1. Oorzaak gericht oplossen
- In de database staat project 107c al correct op `afgerond`, maar op projectniveau staat `toewijzing = pool` en `toegewezen_aan = null`.
- De tabel in Beheer > Projecten gebruikt nu voor de kolom Auditor nog steeds de projecttoewijzing. Daardoor verschijnt bij afgeronde projecten soms `Pool`, terwijl de echte beoordelaar alleen nog op finding-niveau staat (`toegewezen_beoordelaar`).

2. Afgerond-tabel aanpassen
- De afgerond-weergave krijgt een aparte bron voor de kolom `Auditor`.
- Voor afgeronde projecten bepaal ik de auditor op basis van de laatste afgeronde, adviseur-zichtbare bevinding:
  - primair: de auditor van de meest recent goedgekeurde/afgesloten bevinding (`toegewezen_beoordelaar`)
  - fallback: de projecttoewijzing (`toegewezen_aan`) als er geen bruikbare finding-data is
  - laatste fallback: `—`
- Daarmee toont 107c de naam van de echte auditor in plaats van `Pool`.

3. Datalaag uitbreiden in Inbox
- `src/pages/Inbox.tsx` uitbreiden zodat bij het laden van projecten ook de benodigde auditornaam voor afgeronde projecten wordt opgebouwd.
- Dit gebeurt zonder de bestaande actieve werkstromen voor nieuw/bezig te veranderen.
- Voor projecten zoals 107b, waar meerdere auditors op verschillende bevindingen kunnen hebben gewerkt, toon ik de auditor die de audit als laatste heeft afgerond (dus de meest recente afsluitende beoordeling).

4. Presentatie in FaseTabel corrigeren
- `src/components/projecten/FaseTabel.tsx` aanpassen zodat in `isAfgerondView` de kolom `Auditor` niet meer de pool-/toewijzingsstatus toont, maar de afgeleide auditornaam.
- De bestaande wijzigingen blijven behouden:
  - geen kolommen `Labels` en `Toewijzing`
  - kolom `Toegewezen aan` heet `Auditor`
  - kolom `Afgerond` toont de afrondingsdatum

5. Controle na implementatie
- Specifiek verifiëren dat:
  - 107c onder `Afgerond` niet meer `Pool` toont maar de auditornaam
  - 107b ook een logische auditor toont
  - actieve projecten hun huidige toewijzingsgedrag behouden
  - er nergens onbedoeld `Pool` verschijnt in de afgerond-weergave

Technische details
- Bestanden: `src/pages/Inbox.tsx`, `src/components/projecten/FaseTabel.tsx`
- Waarschijnlijk voeg ik een extra veld toe aan het viewmodel, bijvoorbeeld `afgerond_door_profiel` of vergelijkbaar.
- Geen schemawijziging nodig; dit is vooral een correctie in hoe afgeronde projecten worden samengesteld en weergegeven.