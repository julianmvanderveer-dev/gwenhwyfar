# Duidelijker maken wat "goedkeuren" betekent bij een geaccepteerde afwijking

## Wat je nu ziet

Bij bevinding "Ventilatiesysteem correct ingevoerd" (project 6417VG2) heeft de EP-adviseur de afwijking geaccepteerd. Het systeem heeft daarop automatisch al een concept "Goedgekeurd" klaargezet. Daardoor staat de knop "Reactie goedkeuren" grijs ("Goedgekeurd (concept)") en lijkt het alsof je alleen nog kunt kiezen tussen "Afwijking vervalt" en "Niet akkoord".

Er is dus geen tegenspraak: goedkeuren is al gebeurd, alleen niet zichtbaar genoeg. Wel is de tekst onduidelijk en kun je de goedkeuring niet meer aanpassen of van een toelichting voorzien.

## Wat er verandert

1. De groene melding zegt voortaan expliciet wat de keuze inhoudt:
   - Goedgekeurd: "De afwijking blijft staan en telt mee in het rapport en de EP2-beoordeling."
   - Afwijking vervalt: "De afwijking wordt 'Goed' en telt niet meer mee."
   - Niet akkoord: ongewijzigd.
2. Als de goedkeuring automatisch is gezet (omdat de adviseur accepteerde), staat dat erbij vermeld.
3. De knop "Goedgekeurd (concept)" wordt weer aanklikbaar als "Wijzig: goedkeuren", zodat je alsnog een toelichting kunt meegeven — net zoals bij de andere twee keuzes.
4. Bij het openklappen van goedkeuren komt een kort tekstje dat de afwijking blijft staan, met een veld voor een optionele toelichting en een knop "Annuleren".

## Technisch

Alleen `src/pages/FindingBeoordeling.tsx`:

- Concept-banner (regels ~376-404): omschrijvingen per concepttype uitbreiden met het gevolg; markering toevoegen wanneer het concept automatisch is aangemaakt (herkenbaar aan de bestaande automatische toelichting).
- Keuzeblok (regels ~406-450): `disabled={loading || isAkkoord}` vervangen door alleen `disabled={loading}`; label wordt "Wijzig: goedkeuren" bij een bestaand akkoord-concept; klik opent een nieuwe modus `akkoord` in plaats van direct opslaan.
- Nieuwe modus-sectie `akkoord` naar het model van de bestaande `vervallen`-sectie, met optionele toelichting die via de bestaande `akkoord`-functie in `concept_beoordeling` wordt opgeslagen.

Geen wijzigingen aan de verzendlogica, statussen of de database.
