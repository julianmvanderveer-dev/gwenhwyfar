

## Plan: CC julian@borgch.nl op alle EP-adviseur mails

### Wat er verandert

Er zijn twee plekken waar de CC moet worden toegevoegd:

1. **`send-transactional-email/index.ts`** — De Resend API ondersteunt een `cc` veld. We voegen ondersteuning toe voor een optioneel `cc` veld in de request body, dat wordt doorgegeven aan de Resend API call.

2. **`notify-adviseur/index.ts`** — Bij het aanroepen van `send-transactional-email` voegen we `cc: "julian@borgch.nl"` toe aan de body. Dit is de enige plek waar EP-adviseur mails worden verstuurd, dus alle adviseur-notificaties krijgen automatisch de CC.

### Wijzigingen

**`supabase/functions/send-transactional-email/index.ts`**:
- Lees optioneel `cc` veld uit de request body
- Voeg `cc` toe aan de Resend API payload (als array)

**`supabase/functions/notify-adviseur/index.ts`**:
- Voeg `cc: "julian@borgch.nl"` toe aan de `send-transactional-email` invocation body

### Herdeploy
Beide Edge Functions worden opnieuw gedeployed na de wijzigingen.

### Toekomst
Wanneer de CC niet meer nodig is, kan de hardcoded CC in `notify-adviseur` simpelweg worden verwijderd.

