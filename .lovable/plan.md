

## Plan: Automatisch `ep_adviseur`-rol toekennen bij koppeling adviseur

### Probleem
Adviseurs in de `adviseurs`-tabel krijgen hun `user_id` gekoppeld via de trigger `link_user_to_adviseur` (bij registratie). Maar die trigger kent **geen rol** toe in `user_roles`. Daardoor heeft een EP-adviseur wel een account en een adviseur-record, maar geen `ep_adviseur`-rol — en ziet dus niets.

### Oplossing

**1. Trigger `link_user_to_adviseur` uitbreiden** (database migratie)

Na het koppelen van de `user_id` aan de adviseur-record, ook automatisch de `ep_adviseur`-rol toevoegen in `user_roles`:

```sql
CREATE OR REPLACE FUNCTION public.link_user_to_adviseur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.adviseurs SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;

  -- Auto-assign ep_adviseur role if linked
  IF EXISTS (SELECT 1 FROM public.adviseurs WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ep_adviseur')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
```

**2. Bestaande data repareren** (data-update)

Voor de huidige EP-adviseur die al gekoppeld is maar geen rol heeft:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('9d94d2fa-00bd-45ca-b1b2-b73f7665072d', 'ep_adviseur');
```

### Bestanden

| Onderdeel | Actie |
|-----------|-------|
| Database trigger `link_user_to_adviseur` | Uitbreiden met rol-toekenning |
| `user_roles` tabel | Data-insert voor bestaande gebruiker |

Geen codewijzigingen nodig — alleen database-aanpassingen.

