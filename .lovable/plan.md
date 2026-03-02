

# Tekstvelden bewerkbaar maken op Checklist Beheer

## Wijziging

In `src/pages/ChecklistBeheer.tsx` de kolommen **Code**, **Onderdeel** en **Controlepunt** omzetten van plain text naar bewerkbare `<Input>`-velden. Bij elke wijziging wordt het item gemarkeerd als gewijzigd (highlight + meegeteld in de opslaan-knop).

### Concrete aanpassingen

1. **Tabelcellen** (regels 84-86): vervang de statische tekst door `<Input>` componenten die `onChange` de waarde in state bijwerken en het id aan de `changed`-set toevoegen.

2. **Opslaan-functie** (regel 55): stuur naast `deel` ook `code`, `onderdeel` en `controlepunt` mee in de update.

3. **Helper-functie** toevoegen: een generieke `updateField(id, field, value)` die het juiste item in state aanpast en als gewijzigd markeert.

Alleen `ChecklistBeheer.tsx` wordt aangepast, geen database- of routewijzigingen nodig.

