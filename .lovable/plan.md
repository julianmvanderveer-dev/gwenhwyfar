

## Plan: Notificatie naar julian@borgch.nl bij elke uitnodiging

### Probleem
Bij het opnieuw uitnodigen van medewerkers via de Beheer-pagina (`resend_invite` actie in `create-team-member`) wordt geen kopie/notificatie naar julian@borgch.nl gestuurd. De Supabase Auth invite API ondersteunt geen CC-veld.

### Oplossing
Na een succesvolle `inviteUserByEmail` in de `resend_invite` actie, een aparte notificatie-mail sturen naar julian@borgch.nl via `send-transactional-email` (zelfde patroon als in `notify-adviseur`).

### Technische details

**Bestand: `supabase/functions/create-team-member/index.ts`**

In de `resend_invite` blok (regels 90-103), na succesvolle invite:
- Een `fetch` naar `send-transactional-email` toevoegen met het `audit-afgerond` template (hergebruik als notificatie-template)
- Inhoud: "Uitnodiging opnieuw verstuurd naar [naam] ([email])"
- Ontvanger: julian@borgch.nl

Hetzelfde toevoegen in het originele create-flow (regels 120+) wanneer een nieuwe medewerker wordt uitgenodigd via `invite: true`.

Na wijziging: `create-team-member` herdeployen.

