

## Diagnose: Project niet zichtbaar voor EP-adviseur

### Oorzaak
Het project "Testen geheel 01" is gekoppeld aan adviseur **"Jean Martinez"** (id `014e0705...`). Die adviseur-record heeft `user_id` = `bd6b7436...`, wat hoort bij **julianmvanderveer@gmail.com** (zonder +epadviseur).

Wanneer je inlogt als `julianmvanderveer+epadviseur@gmail.com`, is je auth user_id `9d94d2fa...`. Die matcht met een ándere adviseur-record: **"Test EP-adviseur"** (id `4a4277a2...`).

Kortom: er zijn **twee adviseur-records** met hetzelfde e-mailadres maar gekoppeld aan verschillende auth-gebruikers. Het project is aan de verkeerde gekoppeld.

### Oplossing

**Optie A — Data corrigeren**: Koppel het project aan de juiste adviseur-record ("Test EP-adviseur", id `4a4277a2...`), of verwijder de dubbele adviseur "Jean Martinez".

**Optie B — Code aanpassen**: Geen codewijziging nodig — dit is puur een datakoppeling-issue.

Ik kan de projectkoppeling rechtzetten via een database-update als je wilt. Welke adviseur-naam moet aan dit project hangen — "Test EP-adviseur" of "Jean Martinez"? Of wil je de dubbele adviseur-record opschonen?

