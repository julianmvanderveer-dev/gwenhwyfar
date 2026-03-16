

## Plan: Upload-eis checkbox toevoegen bij initiële "Niet goed" beoordeling

### Wijzigingen

#### `src/pages/ProjectDetail.tsx`

1. Import `Checkbox` component
2. In de toelichting-rij (regel 438-448) die verschijnt bij `niet_goed`: een checkbox toevoegen "Upload vereist voor EP-adviseur"
3. Bij wijziging van de checkbox: `upload_vereist` updaten op de finding via `supabase.from("findings").update({ upload_vereist }).eq("id", f.id)`
4. De checkbox is alleen zichtbaar/bewerkbaar wanneer `editable && f.beoordeling === "niet_goed"`

De checkbox komt direct onder de toelichting in dezelfde uitklapbare rij, zodat de tekenaar/auditor bij het beoordelen als "Niet goed" meteen kan aangeven of extra documentatie vereist is.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | Checkbox voor `upload_vereist` toevoegen in de niet_goed toelichting-rij |

