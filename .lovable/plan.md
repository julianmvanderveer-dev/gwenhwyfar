

## Plan: Audit-overzicht per EP-adviseur bij projectaanmaak

### Wat

Wanneer een gebruiker (beheer, tekenaar of auditor) een adviseur selecteert bij het aanmaken van een nieuw project, verschijnt er direct een overzicht van alle projecten die het afgelopen jaar voor deze adviseur zijn geaudit. Dit voorkomt dubbele audits.

### Hoe

**Bestand: `src/pages/ProjectAanmaken.tsx`**

1. **Nieuwe state**: `adviseurProjecten` array om eerdere projecten op te slaan
2. **useEffect op `adviseurId`**: Wanneer een adviseur wordt geselecteerd, query `projects` waar `adviseur_id` gelijk is aan de geselecteerde adviseur en `datum_aangemaakt` binnen het afgelopen jaar valt. Haal `projectnaam`, `audit_categorie`, `audit_soort`, `status` en `datum_aangemaakt` op.
3. **UI-blok**: Toon onder het adviseur-selectveld een compact overzichtsblok:
   - Titel: "Audits afgelopen jaar voor [adviseurnaam]"
   - Tabel met kolommen: Projectnaam | Categorie | Soort | Status | Datum
   - Als er geen projecten zijn: "Geen audits gevonden in het afgelopen jaar."
   - Visuele waarschuwing (gele achtergrond) als er wél projecten zijn, zodat de gebruiker bewust de keuze maakt

### Geen database-wijzigingen nodig

De benodigde data (projects + adviseur_id + datum_aangemaakt) is al beschikbaar. RLS-policies staan beheer, tekenaar en auditor al toe om projecten te lezen.

### Bestand

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectAanmaken.tsx` | useEffect voor adviseur-projecten, overzichtstabel onder adviseur-select |

