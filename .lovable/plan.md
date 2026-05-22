## Probleem

In Beheer → Projectteam zit de verwijderknop al in de actie-kolom, maar die kolom heeft een vaste breedte `w-12` (48 px) terwijl er drie iconen in moeten (Send, Mail, Trash ≈ 92 px). De header staat leeg, dus visueel valt er niets te ontdekken en de prullenbak wordt afgesneden / weggedrukt — vooral bij rijen waar ook de "Mail"-knop verschijnt voor onbevestigde accounts.

## Wijzigingen in `src/pages/Beheer.tsx`

1. Header van de actie-kolom (regel 575) krijgt label en bredere width:
   - `<th className="w-32" />` → `<th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32">Acties</th>`
2. Groep-header rij (regel 558) tweede lege `<th />` mag blijven — alleen tweede th krijgt dezelfde colSpan-uitlijning (geen wijziging nodig).
3. Data-cell (regel 699) `<td className="text-center px-3 py-2.5">` met `<div className="flex gap-1 justify-center">` blijft, maar voeg `whitespace-nowrap` en zorg dat de td-breedte volstaat (`w-32`).
4. Maak de prullenbak‑knop visueel duidelijker:
   - extra `border` of `bg-destructive/10` op hover, en `aria-label="Verwijderen"`.
5. Stel ook in de Add-modus rij (regel 648) dezelfde kolom-breedte in zodat de tabel goed uitlijnt.

## Geen backend-wijzigingen
Edge function `create-team-member` met `action: "delete_user"` is reeds gedeployed in de vorige iteratie. Alleen UI-aanpassingen nodig.

## Verificatie
Na de aanpassing: in de Projectteam-tabel zie je nu een kolom "Acties" met drie zichtbare knoppen per rij (platform-uitnodiging, evt. mail-resend, en de rode prullenbak).