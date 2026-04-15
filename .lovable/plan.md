

## Plan: Fix 401, automatische uitnodigingsmails, CC-verificatie

### Probleem 1: 401-fout bij send-transactional-email

**Oorzaak:** `notify-adviseur` roept `send-transactional-email` aan via `admin.functions.invoke()`, maar de Supabase gateway blokkeert dit ondanks `verify_jwt = false` in de config. De signing-keys van het platform overschrijven deze instelling.

**Oplossing:** In `notify-adviseur` de aanroep veranderen van `admin.functions.invoke()` naar een directe HTTP `fetch()` naar de functie-URL met de service role key als Bearer token. Dit omzeilt de gateway-authenticatie:

```typescript
const resp = await fetch(
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ templateName, recipientEmail, cc, templateData }),
  }
);
```

### Probleem 2: Automatische uitnodigingsmail voor nieuwe adviseurs

Wanneer `notify-adviseur` een adviseur mailt die nog geen `user_id` heeft (= geen account op het platform), moet er automatisch een uitnodiging worden verstuurd via `adminClient.auth.admin.inviteUserByEmail()`.

**Wijzigingen in `notify-adviseur/index.ts`:**
1. Na het ophalen van de adviseur, ook `user_id` meenemen in de query
2. Als `user_id` is `null`: een uitnodiging versturen via de admin auth API
3. De uitnodigingsmail wordt verzorgd door Supabase Auth zelf (via het bestaande invite-template)
4. Na succesvolle invite: de adviseur-record updaten met het nieuwe `user_id`
5. CC `julian@borgch.nl` op de uitnodiging is niet standaard mogelijk via de auth invite API, maar we loggen de uitnodiging en sturen een aparte notificatie-mail naar Julian dat er een nieuwe adviseur is uitgenodigd

### Probleem 3: CC naar julian@borgch.nl

De CC-logica is correct geïmplementeerd in de code:
- `notify-adviseur` stuurt `cc: "julian@borgch.nl"` mee
- `send-transactional-email` leest het `cc` veld en stuurt het door naar Resend

Dit werkt zodra probleem 1 is opgelost. Na de fix wordt de CC automatisch meegestuurd.

---

### Technische details

**Bestanden die worden gewijzigd:**

1. **`supabase/functions/notify-adviseur/index.ts`**:
   - Adviseur-query uitbreiden met `user_id`
   - `admin.functions.invoke()` vervangen door directe `fetch()` naar de functie-URL
   - Toevoegen: als `adviseur.user_id === null`, automatisch `admin.auth.admin.inviteUserByEmail()` aanroepen
   - Na invite: adviseur-record updaten met het nieuwe user_id en ep_adviseur rol toekennen

2. **Herdeployment** van `notify-adviseur` en `send-transactional-email`

3. **Testen** via de curl tool om te verifiëren dat de volledige flow werkt

