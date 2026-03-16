

## Plan: Tekenaars en auditors kunnen zelf projecten aanmaken

### Wijzigingen

#### 1. RLS-policy: INSERT op projects uitbreiden
Huidige INSERT-policy staat alleen `beheer` toe. Moet uitgebreid worden naar `tekenaar` en `auditor`.

```sql
DROP POLICY "Projects insert" ON public.projects;
CREATE POLICY "Projects insert" ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  has_any_role(ARRAY['beheer'::app_role, 'tekenaar'::app_role, 'auditor'::app_role])
  AND aangemaakt_door = auth.uid()
);
```

#### 2. `ProjectAanmaken.tsx`: Toegangscontrole verbreden
- Rolcheck wijzigen van `hasRole("beheer")` naar `hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")`
- Voor tekenaar/auditor: toewijzing-sectie verbergen (zij maken projecten voor zichzelf aan)
- Bij submit: als de gebruiker tekenaar of auditor is, automatisch `toegewezen_aan` op eigen `user.id` zetten en `toewijzing` op `"specifiek"`

#### 3. `MedewerkerDashboard.tsx`: Knop "Nieuw project" toevoegen
- Op het tabblad "Mijn projecten" een `<Link to="/project/nieuw">` button toevoegen, boven de projecttabellen

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | INSERT-policy uitbreiden naar tekenaar/auditor |
| `src/pages/ProjectAanmaken.tsx` | Rolcheck verbreden, toewijzing-sectie conditioneel tonen, auto-assign bij tekenaar/auditor |
| `src/components/dashboard/MedewerkerDashboard.tsx` | "Nieuw project" knop op tabblad Mijn projecten |

