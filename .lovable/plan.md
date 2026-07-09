Julian van der Veer (julian@borgch.nl) krijgt alle vier de rollen toegewezen: **beheer**, **auditor**, **tekenaar** en **ep_adviseur**.

## Aanpak
Via een data-insert op de `user_roles` tabel worden de ontbrekende rollen toegevoegd voor de user die hoort bij e-mail `julian@borgch.nl`. Bestaande rollen blijven ongewijzigd (via `ON CONFLICT DO NOTHING`).

## Technisch
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role
FROM auth.users u
CROSS JOIN (VALUES ('beheer'), ('auditor'), ('tekenaar'), ('ep_adviseur')) AS r(role)
WHERE u.email = 'julian@borgch.nl'
ON CONFLICT (user_id, role) DO NOTHING;
```

Na uitvoeren even uitloggen en opnieuw inloggen zodat de rollen in de app-sessie geladen worden.