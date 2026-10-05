# EP2-beoordeling automatisch bijwerken bij vervallen fout

## Wat u wilt
De knop "Bijwerken naar actuele fouten" verdwijnt. Zodra een afwijking vervalt (of anderszins het foutenbeeld wijzigt), past de EP2-beoordeling zich vanzelf aan — ook bij een al afgeronde audit.

## Wat we gaan doen

1. **Knop verwijderen**: de knop "Bijwerken naar actuele fouten" op het tabblad EP2-beoordeling komt te vervallen.
2. **Automatisch synchroniseren**: zodra de actuele foutentelling (bijvoorbeeld na "Afwijking vervalt") een andere beoordeling oplevert dan wat er staat, wordt de beoordeling automatisch aangepast — ook als de audit al is afgerond. De wijziging wordt met reden vastgelegd in de wijzigingsgeschiedenis (audit-trail), zodat altijd te zien is wanneer en waarom de status veranderde.
3. **Handmatig overrulen blijft**: heeft de auditor de beoordeling zelf bewust anders gezet (via de keuzelijst, met toelichting), dan blijft die keuze staan en wordt er niet automatisch overheen geschreven. De link "Automatische waarde herstellen" blijft beschikbaar om alsnog terug te gaan naar de automatische waarde.
4. **Bestaande automaat bij versturen blijft**: bij "Alle beoordelingen versturen" wordt de beoordeling al opnieuw berekend; dat blijft ongewijzigd.

## Technisch
- `src/pages/ProjectDetail.tsx`:
  - Verwijder de knop "Bijwerken naar actuele fouten" en de functie `synchroniseerEp2` als aparte handmatige actie.
  - Breid het bestaande auto-effect (regel ~774) uit: niet alleen vóór afronding, maar ook ná afronding automatisch `ep2_beoordeling` bijwerken wanneer `autoEp2` afwijkt van de opgeslagen waarde én er geen handmatige override actief is. Bij een afgeronde audit wordt daarbij een regel in `ep2_status_history` geschreven met reden "Automatisch bijgewerkt naar actuele fouten" + de toelichting uit `autoEp2Reden`.
  - `ep2ManualOverride` wordt gezet zodra de auditor zelf een andere waarde kiest dan de automatische; dan stopt de automaat totdat "Automatische waarde herstellen" wordt gebruikt.
- `src/hooks/useBatchVersturen.ts`: geen wijziging nodig — de herberekening bij versturen (inclusief vervallen afwijkingen) blijft zoals die is.
- Geen databasewijziging nodig.
