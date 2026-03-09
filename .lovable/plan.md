

## Plan: Projectteam uitbreiden — toevoegen + sortering

### 1. Nieuw teamlid toevoegen

Omdat profielen gekoppeld zijn aan auth-gebruikers (via een trigger bij registratie), is een edge function nodig die via de Supabase Admin API een nieuwe gebruiker aanmaakt. Dit zorgt er automatisch voor dat een profiel wordt aangemaakt.

**Nieuwe edge function `create-team-member`:**
- Ontvangt `naam`, `email`, `password`, en optioneel `roles[]`
- Valideert dat aanroeper de `beheer`-rol heeft
- Maakt gebruiker aan via `supabase.auth.admin.createUser()`
- Kent opgegeven rollen toe in `user_roles`
- Retourneert succes/fout

**UI in `Beheer.tsx` (Projectteam-tab):**
- "Medewerker toevoegen" knop bovenaan (zoals bij EP-adviseurs)
- Inline formulierrij met velden: Naam, E-mail, Wachtwoord + rolcheckboxen
- Opslaan roept de edge function aan
- Na succes: herlaad de lijst

### 2. Sortering op rol-prioriteit

Sorteer de profielenlijst op hoogste rol: Beheer (1) → Tekenaar (2) → Auditor (3) → geen rol (4). Bij gelijke prioriteit: alfabetisch op naam.

```typescript
const ROLE_PRIORITY = { beheer: 1, tekenaar: 2, auditor: 3 };
profiles.sort((a, b) => {
  const prioA = Math.min(...a.roles.map(r => ROLE_PRIORITY[r] ?? 99));
  const prioB = Math.min(...b.roles.map(r => ROLE_PRIORITY[r] ?? 99));
  return prioA - prioB || a.naam.localeCompare(b.naam);
});
```

### Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/create-team-member/index.ts` | Nieuw — edge function voor gebruiker aanmaken |
| `src/pages/Beheer.tsx` | Toevoegen-formulier + sorteerlogica |

