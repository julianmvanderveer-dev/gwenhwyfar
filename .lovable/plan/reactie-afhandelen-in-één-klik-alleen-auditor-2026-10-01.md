# Reactie afhandelen in één klik (alleen auditor)

## Hoe het nu werkt
Op het beoordelingsscherm van een reactie klikt de auditor op "Reactie goedkeuren" of "Afwijking vervalt". Daarna opent een tweede blok met een toelichtingsveld en nóg een knop met dezelfde naam. Dat voelt als twee keer goedkeuren. De keuze wordt als concept bewaard en gaat met de groene verstuurknop in het auditscherm mee (die blijft gewoon zoals hij is).

Bij "Afwijking vervalt" wordt de beoordeling na versturen "Goed". De oorspronkelijke classificatie (Niet goed, kritiek of niet-kritiek) wordt dan wel overschreven en staat nergens apart in de historie.

## Wat er verandert
1. **Eén klik = vastgelegd.** "Reactie goedkeuren" en "Afwijking vervalt" leggen de keuze direct vast. Er volgt geen tweede blok en geen tweede knop. Het toelichtingsveld (optioneel) staat altijd direct boven de knoppen, dus je hoeft er niet apart voor te klikken. "Niet akkoord" werkt zoals nu, omdat daar een toelichting verplicht is.
2. **Na het klikken ga je terug naar het project**, zodat je meteen het volgende punt kunt pakken. De teller "x van y beoordeeld" telt het punt direct mee.
3. **Afwijking vervalt = "Goed" overal.** Na het versturen staat het punt in het detailscherm, het projectoverzicht, het rapport en de EP2-telling op "Goed" (dat werkt al zo). Dit geldt voor beide situaties: de adviseur heeft het aangepast, of de auditor had het mis.
4. **De bewijsvoering blijft compleet.** Bij het versturen komt er een vast bericht in de historie, met datum en naam van de auditor, bijvoorbeeld:
   "[Afwijking vervallen] Oorspronkelijk: Niet goed – kritiek. Toelichting: ..."
   Reacties en bijlagen van de adviseur blijven onaangetast. Bij goedkeuren komt er ook een bericht in de historie, zoals nu al gebeurt.
5. Je kunt een keuze nog veranderen zolang je niet op de groene knop hebt gedrukt ("Wijzig: ..." blijft beschikbaar).

## Wat niet verandert
- De groene verstuurknop blijft waar hij is, en het versturen naar de adviseur werkt hetzelfde.
- Voor EP-adviseurs en andere rollen verandert er niets.
- Er komen geen nieuwe statussen bij.

## Technisch
- `src/pages/FindingBeoordeling.tsx`: de tussenmodi `akkoord` en `vervallen` vervallen. Er komt één gedeelde optionele toelichting in de keuzemodus. Knoppen roepen `akkoord()` / `afwijkingVervalt()` direct aan en navigeren daarna naar `/project/:id`. Het tekstveld wordt vooraf gevuld met een bestaande concepttoelichting.
- `src/hooks/useBatchVersturen.ts` (tak `vervallen`): vóór de update worden `beoordeling` en `type_afwijking` gelezen en in het historiebericht gezet. Verder blijft de update gelijk.
- De voortgangsteller in `ProjectDetail.tsx` controleren: een concept telt als beoordeeld, en na versturen tellen de afgesloten statussen mee.
- Geen databasewijziging nodig.
