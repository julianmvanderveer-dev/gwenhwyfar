

## Plan: Aandachtspunten verbergen voor EP-adviseur

### Wijziging

**`src/pages/ProjectDetail.tsx`** (regel 561-564): Voeg een rol-check toe zodat het component alleen getoond wordt voor beheer, tekenaar en auditor.

```tsx
// Van:
{project.adviseur_id && (
  <AandachtspuntenAdviseur ... />
)}

// Naar:
{project.adviseur_id && !hasRole("ep_adviseur") && (
  <AandachtspuntenAdviseur ... />
)}
```

Alternatief (als een gebruiker zowel ep_adviseur als tekenaar is, wil je het wél tonen): check expliciet op interne rollen:

```tsx
{project.adviseur_id && (hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")) && (
  <AandachtspuntenAdviseur ... />
)}
```

### Technisch detail

`hasRole` is al beschikbaar in het component via `useAuth()`. Eén regel conditionele logica wijzigen, geen andere bestanden nodig.

