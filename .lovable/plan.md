

## Plan: Projectdetailpagina tonen ook zonder findings

### Probleem
Wanneer een project nog geen findings heeft, toont de pagina alleen "Geen findings." en zijn de projectgegevens, tabs en actieknoppen niet zichtbaar.

### Oplossing in `src/pages/ProjectDetail.tsx`

1. **Tabs altijd tonen** -- Verwijder de `onderdelen.length > 0` conditie. Toon de Tabs-component altijd, ook als er (nog) geen findings zijn. Als er geen findings zijn voor een onderdeel, toon dan een lege tabel met de melding "Geen findings voor dit onderdeel."

2. **Checklist-onderdelen ophalen uit templates** -- Haal de onderdelen op uit de `checklist_templates` tabel (gefilterd op `audit_categorie` van het project) zodat de tabs altijd beschikbaar zijn, ongeacht of er al findings bestaan. Gebruik deze als fallback wanneer `findings` leeg is.

3. **EP2-tab altijd beschikbaar** -- De EP2-beoordelingstab is altijd zichtbaar als laatste tab.

4. **Actieknoppen altijd zichtbaar** -- De knoppen "Deel 1 afronden" en "Audit afronden" blijven onderaan staan ongeacht het aantal findings.

### Technische aanpak

- Query `checklist_templates` met `audit_categorie` filter om de onderdelen te bepalen als er geen findings zijn
- Gebruik `[...new Set([...templateOnderdelen, ...findingOnderdelen])]` zodat tabs altijd getoond worden
- Bij lege findings per onderdeel: toon "Nog geen findings" tekst in de tabel
- Verwijder de `else` tak met "Geen findings."

Geen database-wijzigingen nodig.

