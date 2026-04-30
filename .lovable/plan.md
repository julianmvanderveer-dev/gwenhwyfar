Ik heb de oorzaak bevestigd: projecten 107b en 107c staan in de database nog echt op `wacht_op_reactie`, terwijl alle voor de adviseur zichtbare bevindingen al `reactie_goedgekeurd` zijn. De inbox toont dus de huidige data correct; het probleem is dat de projectstatus niet is meegegaan naar `afgerond`.

Plan

1. Datastatus direct herstellen
- Een veilige, idempotente backend-fix uitvoeren die projecten op `afgerond` zet wanneer alle adviseur-zichtbare bevindingen al in een eindstatus staan.
- Daarbij 107b en 107c expliciet meenemen, en de query zo opzetten dat vergelijkbare vastgelopen projecten meteen ook worden meegenomen.
- `gearchiveerd_op` invullen zodat ze ook in de juiste groep en zichtbaarheid vallen.

2. Afrondlogica robuuster maken
- De bestaande afrondcontrole in `src/hooks/useBatchVersturen.ts` nalopen en aanscherpen zodat de projectstatus altijd wordt bijgewerkt zodra de laatste openstaande adviseur-bevinding is goedgekeurd.
- Controleren of er nog een tweede pad bestaat waardoor een bevinding op `reactie_goedgekeurd` kan komen zonder dat de projectstatus wordt herberekend; als dat zo is, daar dezelfde reconciliatie toevoegen.
- Voorkomen dat alleen losse bevindingen sluiten terwijl het project als geheel blijft hangen op `wacht_op_reactie`.

3. Overzicht controleren
- Verifiëren dat 107b en 107c daarna niet meer onder “Reactie EP-adviseur gevraagd” staan.
- Controleren dat ze in de inbox onder “Afgerond” vallen en niet meer onterecht in de actieve projectlijst blijven hangen.

Technische details
- Huidige database-status:
  - `7108AA107b, Wooldseweg, Woold` → `wacht_op_reactie`
  - `7108AA107c, Wooldseweg, Woold` → `wacht_op_reactie`
- Alle adviseur-zichtbare bevindingen voor deze twee projecten staan al op `reactie_goedgekeurd`.
- In de code staat de bedoelde afrondlogica al in `src/hooks/useBatchVersturen.ts`, dus dit lijkt nu vooral een combinatie van vastgelopen data en mogelijk nog één route waarin die afrondcheck niet wordt geraakt.

Na akkoord voer ik dit meteen door en controleer ik dat die twee projecten echt uit die foutieve status verdwijnen.