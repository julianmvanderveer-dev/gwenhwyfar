

## Plan: Database-voorbereiding voor toekomstige modules

### Context
Het systeem is nu ingericht rond audit-categorieën (EPW-B/D, EPU-B/D, MWA-B/U) met bijbehorende checklists en findings. De gevraagde uitbreidingen (personeelsdossiers, bureau-audits, mobiele opname, externe rapportages) vereisen een flexibelere datastructuur. Dit plan bereidt de database voor **zonder de huidige weergave te wijzigen**.

### Wat verandert er

#### 1. Database: nieuwe tabel `sectoren` (configurable sectors)
Maakt checklists per sector aanpasbaar en bereidt voor op sector-specifieke modules.

```sql
CREATE TABLE public.sectoren (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,        -- bijv. 'energie', 'bouw', 'milieu'
  naam text NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 2. Database: koppeltabel `checklist_templates` ↔ sectoren
Een nullable `sector_id` kolom op `checklist_templates` zodat templates per sector gefilterd kunnen worden. Bestaande templates krijgen geen sector (NULL = beschikbaar voor alle sectoren, backwards compatible).

```sql
ALTER TABLE public.checklist_templates 
  ADD COLUMN sector_id uuid REFERENCES public.sectoren(id);
```

#### 3. Database: nieuwe tabel `modules` (registry voor toekomstige modules)
Registreert welke modules beschikbaar zijn en of ze actief zijn. Hiermee kunnen toekomstige integraties (personeelsdossiers, bureau-audits, etc.) geregistreerd en per organisatie aan/uit gezet worden.

```sql
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,       -- 'personeelsdossier', 'bureau_audit', 'mobiele_opname', 'externe_rapportage'
  naam text NOT NULL,
  beschrijving text,
  actief boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 4. Database: nieuwe tabel `externe_rapportages` (stub voor inlezen)
Voorbereiding voor het importeren van externe rapportages, gekoppeld aan projecten.

```sql
CREATE TABLE public.externe_rapportages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text,               -- storage path
  bron text,                      -- herkomst/systeem
  status text NOT NULL DEFAULT 'nieuw',  -- 'nieuw', 'verwerkt', 'fout'
  metadata jsonb DEFAULT '{}',
  geimporteerd_door uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### 5. RLS-policies
Alle nieuwe tabellen: beheer mag alles, interne rollen mogen lezen. Dezelfde patronen als bestaande tabellen.

#### 6. Seed-data modules
Vier module-registraties worden ingevoegd (allemaal `actief = false`):
- `personeelsdossier` — Personeelsdossiers
- `bureau_audit` — Bureau-audits  
- `mobiele_opname` — Mobiele opname
- `externe_rapportage` — Externe rapportages

### Impact op huidige weergave
**Geen.** Alle wijzigingen zijn puur database-schema. Er worden geen bestaande pagina's, componenten of queries aangepast. De nieuwe tabellen en kolommen zijn nullable of hebben defaults, dus bestaande functionaliteit blijft ongewijzigd.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Nieuwe tabellen `sectoren`, `modules`, `externe_rapportages` + kolom `sector_id` op `checklist_templates` + RLS + seed data |

Geen frontend-wijzigingen.

