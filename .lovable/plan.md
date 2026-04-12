
Ik heb nog één belangrijke inconsistentie bevestigd:

- In de code staat alles al goed op `notify.bengaudit.nl` voor zowel auth- als transactionele e-mails.
- Er zijn geen oude verwijzingen naar Resend in de code.
- De domeincheck zegt nog steeds `Pending` voor `notify.bengaudit.nl`.
- Tegelijk zegt de projectcheck dat er op dit project momenteel géén actief gekoppeld e-maildomein staat.

Dat wijst veel sterker op een vastgelopen of onvolledig gekoppelde domeinconfiguratie dan op een DNS-fout in de app.

Plan
1. In de e-mailinstellingen controleren of `notify.bengaudit.nl` echt aan dit project gekoppeld is, en niet alleen als losse domein-entry bestaat.
2. Als die koppeling ontbreekt of half is blijven hangen: het domein uit de e-mailinstellingen verwijderen en opnieuw toevoegen aan dit project.
3. Daarna opnieuw verifiëren of de status verandert van `Pending` naar een actieve/verifiërende projectstatus.
4. Zodra de koppeling klopt, de e-mailinfrastructuur nogmaals nalopen zodat queue en verzending zeker op het juiste domein draaien.
5. Daarna een echte testmail versturen, bijvoorbeeld met de uitnodiging voor Michel, om end-to-end te bevestigen dat alles werkt.

Wat ik op basis van de huidige gegevens het meest waarschijnlijk vind
- Niet: fout in de appcode.
- Wel: het domein is óf niet goed aan dit project gekoppeld, óf de provisioning in de e-mailinstellingen is blijven hangen ondanks correcte NS-records.

Technische notitie
- `notify.bengaudit.nl` staat hardcoded consistent in de verzendfuncties.
- De auth-mailhook gebruikt al het queue-systeem.
- De status-mismatch tussen “domein bestaat en is pending” versus “project heeft geen custom e-maildomein” is nu het sterkste aanknopingspunt.
