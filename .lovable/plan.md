# Mails naar auditor bij reacties van de EP-adviseur

## Huidige situatie
- De auditor krijgt al een mail ("reactie-ontvangen-auditor") zodra de adviseur álle reacties in één keer verstuurt. Deze werkt (logboek toont verzonden mails).
- Ontbrekend: een mail wanneer de adviseur daarna nog een **aanvulling** plaatst op een bevinding, en wanneer de adviseur een **herafmelding** (bijv. nieuw Energielabel) uploadt.

## Wat we toevoegen

1. **Mail bij aanvulling op een bevinding**
   - Nieuw e-mailsjabloon `aanvulling-ontvangen-auditor` (projectnaam, naam adviseur, controlepunt, link naar de bevinding).
   - Nieuw type `aanvulling_ontvangen` in de bestaande notificatiefunctie; de mail gaat naar de toegewezen auditor van het project.
   - Aanroep vanuit het reactiescherm zodra de adviseur een aanvulling verstuurt.

2. **Mail bij herafmelding-upload**
   - Nieuw e-mailsjabloon `herafmelding-ingediend-auditor` (projectnaam, naam adviseur, bestandsnaam, link naar het project).
   - Nieuw type `herafmelding_ingediend` in de notificatiefunctie.
   - Aanroep vanuit het herafmeldingsonderdeel zodra de adviseur een nieuw label uploadt.

3. **Robuustheid**
   - Mislukte mails blokkeren nooit het opslaan van de aanvulling of upload (fout wordt alleen gelogd).
   - Unieke verzend-sleutels zodat herhalingen geen dubbele mails geven.

## Technische aanpak
- Twee nieuwe React Email-templates in `supabase/functions/_shared/transactional-email-templates/` + registratie in `registry.ts`.
- `notify-auditor/index.ts` uitbreiden met de twee nieuwe types (ontvanger blijft `projects.toegewezen_aan`).
- `src/pages/FindingReactie.tsx` (`verstuurAanvulling`) en `src/components/projecten/Herafmelding.tsx` (upload) roepen de functie aan na succesvolle insert.
- Daarna de gewijzigde functies deployen.
