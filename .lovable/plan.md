

# Achtergrondkleur beheer-rol fixen

## Probleem
julian@borgch.nl heeft zowel de "beheer" als "auditor" rol. In de huidige prioriteitsvolgorde (ep_adviseur → auditor → tekenaar) wordt auditor als eerste gevonden, waardoor de achtergrond blauw is in plaats van wit.

## Oplossing
In `src/components/AppLayout.tsx` de prioriteitsvolgorde aanpassen: **beheer eerst** checken en dan wit/standaard toewijzen, zodat beheerders altijd een witte achtergrond krijgen ongeacht hun andere rollen.

Nieuwe volgorde:
1. `beheer` → geen achtergrondkleur (wit)
2. `ep_adviseur` → `bg-yellow-50`
3. `auditor` → `bg-blue-50`
4. `tekenaar` → `bg-green-50`

