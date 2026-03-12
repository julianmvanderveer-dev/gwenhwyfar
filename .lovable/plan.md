

## Probleem: Medewerker toevoegen blijft hangen

### Oorzaak

De edge function `create-team-member` gebruikt `anonClient.auth.getClaims()` (regel 30). **Deze methode bestaat niet** in de Supabase JS client library. Dit veroorzaakt een fout waardoor de functie een 401 of 500 error teruggeeft, en het formulier blijft hangen in de submitting-state.

### Oplossing

Vervang `getClaims()` door `anonClient.auth.getUser()`, wat de standaard methode is om de ingelogde gebruiker te verifiëren in een edge function:

**Bestand:** `supabase/functions/create-team-member/index.ts`

Regels 30-40 vervangen:
```typescript
// Was: getClaims (bestaat niet)
const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(...)

// Wordt: getUser (standaard Supabase methode)
const { data: { user: caller }, error: userError } = await anonClient.auth.getUser();
if (userError || !caller) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const userId = caller.id;
```

Dit is de enige wijziging. De rest van de functie (rolcontrole, user aanmaken, rollen toewijzen) is correct.

