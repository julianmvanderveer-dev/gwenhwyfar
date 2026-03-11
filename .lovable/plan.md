

## Plan: useAuth.tsx race-condition fix

De verbeterde versie van `useAuth.tsx` lost twee problemen op:

1. **Race condition**: Rollen werden pas geladen ná `loading = false`, waardoor componenten even zonder rollen renderden
2. **Dubbele INITIAL_SESSION**: `getSession()` en `onAuthStateChange` vuurden allebei bij opstart, nu wordt `INITIAL_SESSION` geskipt
3. **Memory leak**: `mounted` flag voorkomt state-updates na unmount

### Wijziging

**`src/hooks/useAuth.tsx`** — Vervang de huidige `useEffect` met de versie uit het bericht:
- `getSession()` wacht op `fetchRoles` vóór `setLoading(false)`
- `onAuthStateChange` skipt `INITIAL_SESSION` event
- `mounted` flag beschermt tegen updates na unmount

Geen breaking changes — zelfde API, zelfde context shape.

