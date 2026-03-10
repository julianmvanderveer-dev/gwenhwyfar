

## Plan: "Interne alert" → "Opmerking" (zichtbaar, geen fout)

### Samenvatting
"Interne alert" wordt hernoemd naar "Opmerking". Een opmerking is **geen fout** (geen type_afwijking, geen deadline), maar **wel zichtbaar** voor de EP-adviseur die erop mag reageren.

### Database migratie

```sql
-- Hernoem enum-waarde
ALTER TYPE beoordeling_type RENAME VALUE 'interne_alert' TO 'opmerking';

-- Wis type_afwijking voor bestaande opmerkingen (was onterecht gezet)
UPDATE findings SET type_afwijking = NULL WHERE beoordeling = 'opmerking';
```

### Code-aanpassingen

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/badges.tsx` | `interne_alert` → `opmerking`, label "OPM" |
| `src/pages/ProjectDetail.tsx` | Zie details hieronder |

**ProjectDetail.tsx wijzigingen:**

1. **Dropdown-optie**: "Interne alert" → "Opmerking" (value `opmerking`)
2. **`updateBeoordeling`**: Bij `opmerking` geen `type_afwijking` zetten, wel `eigenaar_beoordeling`
3. **Type-afwijking dropdown**: Alleen tonen bij `niet_goed` (niet bij `opmerking`)
4. **Toelichting-rij**: Tonen bij `niet_goed` én `opmerking`
5. **`auditAfronden`**: Opmerkingen krijgen `zichtbaar_voor_adviseur: true` maar **geen deadline** en **geen status "open"**. Deadlines en status alleen voor `niet_goed`
6. **`hasKtOrNk` check**: Alleen `niet_goed` telt mee voor deadline-berekening projectstatus (opmerkingen zijn geen fouten)

### Gedrag na wijziging

| Beoordeling | Type afwijking | Deadline | Zichtbaar adviseur | Adviseur mag reageren |
|-------------|---------------|----------|-------------------|----------------------|
| Goed | — | — | Nee | Nee |
| Niet goed | Kritiek/Niet kritiek | Ja | Ja | Ja |
| Opmerking | — | Nee | Ja | Ja |

