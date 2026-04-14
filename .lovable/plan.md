

## Plan: Fix toewijzing Rob Harbers-project + bevestig bestaande logica

### Huidige situatie

De code doet al precies wat je beschrijft:
- **Deel 1 afronden** (`deel1Afronden` in ProjectDetail.tsx): reset `toegewezen_aan → null`, `toewijzing → pool` — het project komt terug in de pool voor auditors
- **Deel 2**: de auditor claimt het project uit de pool. Bij reactie van de EP-adviseur komt het terug bij diezelfde auditor (want `toegewezen_aan` is dan ingevuld)

Het probleem met het project "3862NE1, Bruggenhoofd Nijkerk" is dat dit project **specifiek** aan Hilbert is toegewezen (`toewijzing = specifiek`) en de toewijzing niet is gereset. Waarschijnlijk is deel 1 niet via de "Deel 1 afronden"-knop afgerond, of was het project aangemaakt voordat deze logica bestond.

### Wat er moet gebeuren

1. **Data-fix**: Reset de toewijzing van dit specifieke project zodat het in de auditor-pool verschijnt:
   - `toegewezen_aan → null`
   - `toegewezen_op → null`  
   - `toewijzing → pool`

Dit is een eenmalige datacorrectie. De bestaande code hoeft niet te worden aangepast — de workflow werkt al correct.

