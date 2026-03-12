

## Projecttoewijzingssysteem

### 1. Database migratie

Nieuwe kolommen op `projects` tabel:

```sql
-- Enum voor toewijzingstype
CREATE TYPE public.toewijzing_type AS ENUM ('specifiek', 'pool');

-- Nieuwe kolommen
ALTER TABLE public.projects
  ADD COLUMN toewijzing toewijzing_type NOT NULL DEFAULT 'pool',
  ADD COLUMN toegewezen_aan uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN toegewezen_op timestamptz;
```

Atomische claim-functie (voorkomt race conditions):

```sql
CREATE OR REPLACE FUNCTION public.claim_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET toegewezen_aan = _user_id,
      toegewezen_op = now()
  WHERE id = _project_id
    AND toegewezen_aan IS NULL
    AND toewijzing = 'pool'
    AND status = 'nog_niet_begonnen';
  RETURN FOUND;
END;
$$;
```

### 2. Projectzichtbaarheid (RLS aanpassing)

De huidige `Projects select` policy laat alle interne gebruikers alle projecten zien. Dit moet worden aangescherpt zodat tekenaars/auditors alleen projecten zien die:
- Aan hen zijn toegewezen (`toegewezen_aan = auth.uid()`), OF
- In de pool staan en nog niet gestart (`toewijzing = 'pool' AND toegewezen_aan IS NULL`), OF
- De gebruiker de beheerrol heeft (ziet alles)

### 3. Frontend wijzigingen

**ProjectAanmaken.tsx** — Toewijzingsoptie toevoegen:
- Radio: "Algemene pool" (default) of "Specifieke toewijzing"
- Bij specifiek: dropdown met actieve tekenaars/auditors (uit `profiles` + `user_roles`)
- Sla `toewijzing` en optioneel `toegewezen_aan` + `toegewezen_op` op

**ProjectDetail.tsx** — Atomisch claimen:
- Bij `autoSetStatus`: vervang de directe status-update door eerst `claim_project` RPC aan te roepen
- Als claim faalt (iemand anders was eerder): toon melding "Dit project is al door iemand anders opgepakt" en navigeer terug
- Bij succes: update status zoals nu

**Inbox.tsx** — Toewijzingsinformatie tonen:
- In FaseTabel: kolom "Toegewezen aan" met naam van de toegewezen persoon, of "Pool" als nog niet geclaimed
- Projecten die niet aan de ingelogde tekenaar/auditor zijn toegewezen en al geclaimed zijn, worden verborgen (via RLS)

**FaseTabel.tsx** — Extra kolom:
- "Toegewezen aan" kolom met naam (join op `profiles`) of "Pool"-badge

**Beheer-overzicht** — Nieuw tabblad of sectie op bestaande projectenpagina:
- Per project: toewijzingstype, toegewezen persoon + tijdstip, of "Wacht in pool"
- Acties: "Terugplaatsen in pool" en "Hertoewijzen aan..." (dropdown met tekenaars/auditors)
- Bij hertoewijzing: update `toegewezen_aan`, `toegewezen_op`, en optioneel `toewijzing` naar 'specifiek'

### 4. Herindelingsmeldingen

Geen e-mailnotificaties (conform bestaand patroon). In plaats daarvan:
- Een `notificaties` tabel voor in-app meldingen:

```sql
CREATE TABLE public.notificaties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bericht text NOT NULL,
  gelezen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notificaties ENABLE ROW LEVEL SECURITY;
-- Gebruikers zien alleen eigen notificaties
CREATE POLICY "Eigen notificaties" ON public.notificaties
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

- Bij hertoewijzing door beheer: insert notificatie voor oude gebruiker ("Project X is aan je ontnomen") en nieuwe gebruiker ("Project X is aan je toegewezen")
- Notificatie-indicator in de navigatie (belletje met teller)

### 5. Betrokken bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | 3 kolommen + enum + claim-functie + notificaties-tabel + RLS |
| `src/pages/ProjectAanmaken.tsx` | Toewijzingsopties (pool/specifiek + persoonskeuze) |
| `src/pages/ProjectDetail.tsx` | Atomisch claimen via RPC bij project openen |
| `src/pages/Inbox.tsx` | Toewijzingsinfo laden en doorgeven aan FaseTabel |
| `src/components/projecten/FaseTabel.tsx` | Kolom "Toegewezen aan" |
| `src/pages/Beheer.tsx` | Beheeroverzicht met hertoewijzings-acties |
| `src/components/AppLayout.tsx` | Notificatie-indicator |
| Nieuw: `src/components/NotificatieBel.tsx` | Notificatie-dropdown component |

