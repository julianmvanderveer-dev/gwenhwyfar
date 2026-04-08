

# Project niet zichtbaar voor auditor na deel 1 afronding

## Probleem

Wanneer een tekenaar deel 1 afrondt, verandert alleen de status naar `deel1_afgerond`. Het project blijft echter **specifiek toegewezen aan de tekenaar** (Hilbert). De RLS-policy zorgt ervoor dat alleen de toegewezen persoon of pool-projecten zichtbaar zijn. Julian (auditor) kan het project daarom niet zien.

Het project `7108AA107c` staat nu op `deel2_bezig` en is nog steeds toegewezen aan Hilbert.

## Oplossing

### 1. `src/pages/ProjectDetail.tsx` — `deel1Afronden` aanpassen

Na het afronden van deel 1:
- `toegewezen_aan` op `null` zetten
- `toegewezen_op` op `null` zetten  
- `toewijzing` op `pool` zetten

Hierdoor komt het project automatisch in de pool voor auditors terecht.

### 2. Database fix — huidig project corrigeren

Het project `50db86bc-7e4f-4ff8-aea9-fce84199542e` handmatig terugzetten naar de pool zodat Julian het kan zien en claimen:

```sql
UPDATE projects 
SET toegewezen_aan = NULL, 
    toegewezen_op = NULL, 
    toewijzing = 'pool'
WHERE id = '50db86bc-7e4f-4ff8-aea9-fce84199542e';
```

### 3. Optioneel: notificatie toevoegen

Bij het vrijgeven na deel 1, een notificatie sturen naar auditors dat er een nieuw project in de pool staat.

| Bestand | Wijziging |
|---|---|
| `src/pages/ProjectDetail.tsx` | `deel1Afronden`: project vrijgeven naar pool na statuswijziging |
| Database (migration) | Huidig project corrigeren naar pool |

