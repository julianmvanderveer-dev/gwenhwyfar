# Plan

## Probleem
Op **Beheer → Projectteam** bestaat het prullenbakje wel, maar het staat in de laatste kolom helemaal rechts (na Projectrollen, Checklistbevoegdheden, Wachtwoord en Actief). Op jouw scherm valt die kolom buiten beeld, dus je ziet hem niet.

## Oplossing
Een tweede, altijd zichtbaar prullenbakje **direct achter de naam** in de eerste kolom van de Projectteam-tabel. De bevestigingsvraag en de verwijderlogica die er al zijn worden hergebruikt.

## Wat ik aanpas
- Bestand: `src/pages/Beheer.tsx`, tab `Projectteam`, in de rij `{profiles.map(...)}` (regel 656-737)
- In de eerste cel (`<td>` met `p.naam`) een klein rood prullenbakje toevoegen, rechts naast de naam
- Klik → bestaande `deleteProfile(p.id, p.naam)` (regel 377), die toont al een bevestigingsvraag waarin staat dat inlogaccount, rollen en categorieën worden gewist
- Knop is uitgeschakeld voor je eigen account (`p.id === user?.id`), zelfde regel als de bestaande knop

## Optioneel
De bestaande prullenbak-knop rechts in de actiekolom laten staan (consistent met de adviseurslijst), zodat niets verandert voor wie wél naar rechts scrollt. Als jij liever hebt dat die weg gaat, zeg het.

## Resultaat
In het Projectteam-overzicht verschijnt direct achter elke naam een rood prullenbakje. Klik → bevestigingsvraag → verwijderen. Voor je eigen account is hij uitgeschakeld.