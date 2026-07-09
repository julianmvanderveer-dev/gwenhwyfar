## Probleem
In `src/pages/Beheer.tsx` verbergt de filter `isProjectteamLid` iedereen met de `ep_adviseur`-rol óf met een e-mail die in de EP-adviseurs tabel staat. Julian heeft nu álle vier de rollen (inclusief `ep_adviseur`), dus valt hij uit de Projectteam-lijst.

## Fix
De regel omdraaien: iemand hoort thuis in **Projectteam** zodra hij minstens één project-rol heeft (`beheer`, `tekenaar` of `auditor`). De EP-adviseurs tab blijft ongewijzigd en toont de records uit de `adviseurs` tabel.

```ts
const isProjectteamLid = (p: { roles: Enums<"app_role">[] }) =>
  PROJECT_ROLES.some((r) => p.roles.includes(r));
```

Effect:
- Julian verschijnt weer in Projectteam (heeft beheer/auditor/tekenaar).
- Pure EP-adviseurs (alleen `ep_adviseur`, geen andere rol) blijven uit Projectteam en staan alleen in het EP-adviseurs tabblad.
- Personen zonder enige rol verschijnen niet in Projectteam (was voorheen wel het geval, maar hoort daar ook niet thuis).

Geen database-wijzigingen nodig.