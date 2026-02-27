

# EP-adviseur testaccount koppelen aan adviseurs-tabel

## Probleem
Het testaccount `julianmvanderveer+EPadviseur@gmail.com` heeft de rol `ep_adviseur`, maar er is geen record in de `adviseurs`-tabel met dat e-mailadres. Daardoor kan de RLS-policy geen projecten/findings tonen aan dit account.

## Oplossing

1. **Adviseur-record aanmaken** via data-insert:
   - `naam`: "Test EP-adviseur"
   - `email`: `julianmvanderveer+epadviseur@gmail.com` (let op: Gmail normaliseert hoofdletters)
   - `nummer`: 998 (of ander testnummer)
   - `actief`: true

2. **User_id koppelen**: het profiel van het testaccount opzoeken in `profiles` op basis van e-mail, en de `user_id` direct invullen in het adviseurs-record (de trigger werkt alleen bij nieuwe registraties, niet retroactief).

## Geen code-aanpassingen nodig
Alleen een data-insert + update in de `adviseurs`-tabel.

