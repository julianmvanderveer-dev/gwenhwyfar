## Doel

In de **Beheer**-pagina een nieuwe sectie waar beheerders een CSV kunnen downloaden van **alleen afgeronde projecten**, met optionele datumfilter op afrondingsdatum.

## Wijzigingen

### 1. Nieuwe tab "Exports" in `src/pages/Beheer.tsx`
- Tab `exports` toevoegen aan de `TabsList` (icoon `Download`) tussen `toewijzingen` en `feedback`.
- `TabsContent value="exports"` met één Card "Afgeronde projecten exporteren".

### 2. Logica binnen die Card
- Bij mount: `supabase.from("projects").select("projectnaam, audit_categorie, audit_soort, prioriteit, toelatingsaudit, datum_aangemaakt, reactie_deadline, gearchiveerd_op, status, adviseurs:adviseur_id(naam, email)").in("status", ["afgerond", "gesloten"]).order("gearchiveerd_op", { ascending: false })`.
- UI-filters (compact, zelfde stijl als bestaande `ExportFilter`):
  - Jaar (afrondingsjaar, `gearchiveerd_op`) — opties: alle / huidige 3 jaren.
  - Van/Tot datum op `gearchiveerd_op`.
- Teller "X project(en)" + knop **Download CSV** → `downloadCsv()` uit `@/lib/csv`.

### 3. CSV-kolommen
Projectnaam, Status, Categorie, Soort, Prioriteit (Ja/Nee), Toelatingsaudit (Ja/Nee), EP-adviseur, E-mail adviseur, Datum aangemaakt, Afgerond op. Datums `toLocaleDateString("nl-NL")`. Filename: `afgeronde-projecten-{jaar|selectie}.csv`.

### 4. Toegang
Geen schema- of RLS-wijzigingen — `projects` is al leesbaar voor `beheer` via bestaande policies. De Beheer-pagina is al door rol afgeschermd.

## Niet gewijzigd

- Bestaande `ExportFilter` component (gebruikt op andere plekken).
- Andere Beheer-tabs, DB, edge functions, e-mailflows.
