## Probleem
Het prullenbakje staat nu rommelig naast de naam. Liever netjes uitgelijnd in een eigen kolom rechts van de "Wachtwoord"-kolom.

## Oplossing
In `src/pages/Beheer.tsx`, Projectteam-tabel:

1. **Inline trash naast naam weghalen** (regels 661-671 in de naam-`<td>`).
2. **Acties-cel splitsen in twee kolommen:**
   - Kolom "Wachtwoord": Send-icoon (+ Mail-icoon als account onbevestigd).
   - Nieuwe kolom "Verwijderen": het rode prullenbakje, gecentreerd.
3. **Kolomkoppen bijwerken:**
   - Header rij 2: "Acties" → "Wachtwoord", en een nieuwe kop "Verwijderen" erachter.
   - Header rij 1: laatste `<th />` van colSpan 1 naar colSpan 2 zodat de bovenrij blijft kloppen.

Verwijderlogica (`deleteProfile`) en de "kan eigen account niet verwijderen"-regel blijven ongewijzigd.

## Resultaat
Elke rij toont het prullenbakje in een eigen, smalle kolom helemaal rechts, netjes uitgelijnd onder kop "Verwijderen", direct achter "Wachtwoord". Rustiger beeld, geen knop meer naast de naam.
