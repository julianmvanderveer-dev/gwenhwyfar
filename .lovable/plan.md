

## Plan: Vereenvoudig "Bezig" tabel — klikbare namen voor hertoewijzing

### Probleem
De "Bezig" tabel is te druk door een aparte "Toewijzing" kolom met knoppen (Hertoewijzen / Pool). De "Pool" badge is irrelevant voor projecten die al bezig zijn.

### Oplossing

**`src/components/projecten/FaseTabel.tsx`**:

1. **Kolom "Toegewezen aan" aanpassen**: Toon de naam van de tekenaar of auditor. Geen "Pool" badge in de Bezig-groep (pool geldt alleen voor Nieuw).

2. **Naam klikbaar maken**: Klik op de naam opent een inline dropdown (select) om direct te hertoewijzen. Bevestig met ✓, annuleer met ✗. Geen aparte "Toewijzing" kolom meer nodig.

3. **Verwijder de aparte "Toewijzing" kolom** voor de Bezig-groep: de hertoewijzingsactie zit nu in de "Toegewezen aan" kolom zelf.

**Gedrag per groep**:
- **Nieuw**: Toont "Pool" of naam + hertoewijzingsknoppen (bestaand gedrag behouden)
- **Bezig**: Toont naam (klikbaar voor hertoewijzing). Geen Pool-knop.
- **Afgerond**: Toont naam (alleen-lezen)

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/projecten/FaseTabel.tsx` | "Toegewezen aan" kolom: naam wordt klikbare trigger voor hertoewijzing-dropdown. Aparte "Toewijzing" kolom verbergen wanneer `showSubstatus` actief is (Bezig-groep). |
| `src/pages/Inbox.tsx` | Geen wijzigingen nodig — props blijven gelijk. |

### Technisch detail

In FaseTabel wordt de "Toegewezen aan" cel als volgt:
- **Niet aan het bewerken**: `<button onClick={startEdit}>{naam}</button>` (cursor pointer, underline on hover)
- **Aan het bewerken**: `<select>` + ✓/✗ knoppen (bestaande logica, verplaatst naar deze kolom)
- De aparte `canReassign` kolom en header worden verwijderd voor de Bezig-groep (via een nieuwe prop `inlineToewijzing`)

