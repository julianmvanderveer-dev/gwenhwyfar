

# Fix: Code-kolom te smal voor subcodes

## Probleem
De subcodes (1a, 1b, 5k etc.) staan correct in de database, maar de Code-kolom (`w-16` = 4rem) is te smal om de volledige code weer te geven. Hierdoor zie je alleen "1", "2", "3" zonder de letters.

## Oplossing in `src/pages/ChecklistBeheer.tsx`

De kolombreedte van Code vergroten van `w-16` naar `w-24` (of breder), zodat codes als "1a", "4m", "5k" volledig zichtbaar zijn. Eventueel ook de `font-mono` input iets breder maken.

Eén regel aanpassen in de `renderTable` functie en één in de `TableHead`.

