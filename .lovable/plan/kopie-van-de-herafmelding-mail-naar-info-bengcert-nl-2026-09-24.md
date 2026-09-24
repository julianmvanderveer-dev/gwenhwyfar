# Kopie van de herafmelding-mail naar info@bengcert.nl

## Doel
Julian wil eenmalig een kopie ontvangen van de mail die EP-adviseur Mourad Malek vandaag om 11:57 (Nederlandse tijd) kreeg over project 1566NS16 (Andoorn, Assendelft).

## Wat is er gevonden
- De mail is vanochtend verstuurd en succesvol afgeleverd (template "herafmelding-vereist").
- Het project staat inderdaad op "Wacht op nieuwe afmelding", dus de mail klopt.
- De mail wordt opgebouwd door de bestaande mailfunctie met de naam van de adviseur, de projectnaam en een directe link naar het project.

## Aanpak
1. Dezelfde mail opnieuw opbouwen met exact dezelfde inhoud (naam adviseur, projectnaam, projectlink).
2. Versturen naar info@bengcert.nl in plaats van naar de adviseur.
3. De verzending wordt netjes gelogd, zodat later zichtbaar is dat deze kopie is verstuurd.

Er worden geen schermen of instellingen aangepast; dit is een eenmalige verzending.

## Technische details
- Bestaande edge function `send-transactional-email` direct aanroepen met templateName `herafmelding-vereist`, recipientEmail `info@bengcert.nl`, templateData: adviseurNaam "Mourad Malek", projectnaam "1566NS16 (Andoorn, Assendelft)", projectId `55acef6d-72f7-4814-8d77-f2566d4d599b`.
- Unieke idempotencyKey zodat de mail niet als duplicaat wordt overgeslagen.
- Controleren in `email_send_log` dat de kopie de status "sent" krijgt.
