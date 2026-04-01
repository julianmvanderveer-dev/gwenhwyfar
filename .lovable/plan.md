

## Plan: Doorklik naar volledige audit voor EP-adviseur

### Probleem

De EP-adviseur ziet projectnamen in het afwijkingen-overzicht, maar deze zijn niet klikbaar. Er is geen manier om naar de projectdetailpagina te navigeren en de volledige audit in te zien.

### Oplossing

**1. `src/components/dashboard/AdviseurSectie.tsx`** — Projectnaam klikbaar maken

De projectnaam-kolom in de tabel wordt een `<Link>` naar `/project/:id`. Hiervoor moet het `project_id` beschikbaar zijn in de finding data (dat is het al via `f.project_id`).

```tsx
// Van:
<td className="px-4 py-2.5 font-medium">{f.projectnaam}</td>

// Naar:
<td className="px-4 py-2.5 font-medium">
  <Link to={`/project/${f.project_id}`} className="text-accent hover:underline">
    {f.projectnaam}
  </Link>
</td>
```

**2. `src/pages/Inbox.tsx`** — Projectenlijst toevoegen voor EP-adviseur

Onder het afwijkingen-overzicht een compact blok toevoegen met alle projecten van de adviseur (niet alleen findings), zodat de adviseur ook projecten zonder bevindingen kan openen:

- Query: de bestaande `projectData` uit `loadAdviseurData` bevat al `id` en `projectnaam`
- Toon een lijst met klikbare projectnamen als links naar `/project/:id`
- Opslaan in nieuwe state `adviseurProjecten`

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/dashboard/AdviseurSectie.tsx` | Projectnaam als `<Link>` naar projectdetail |
| `src/pages/Inbox.tsx` | Projectenlijst met links voor EP-adviseur toevoegen, `adviseurProjecten` state |

