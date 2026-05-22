## Doel

Op de projectdetailpagina, in het kader **Stand van zaken** (kolom "Bal ligt bij"), achter elke getoonde naam een klein prullenbakje tonen waarmee de koppeling kan worden verwijderd. Altijd met een bevestigingsvraag ("Weet je zeker dat …?").

Locatie in code: `src/components/projecten/BeheerStandVanZaken.tsx`, regels 181–198 (de blokken **Toegewezen** en **EP-adviseur**).

## Gedrag per naam

1. **Toegewezen (tekenaar/auditor)**
   - Prullenbakje verschijnt alleen als er iemand toegewezen is (`project.toegewezen_aan` ingevuld).
   - Klik → `confirm("Toewijzing van «naam» loskoppelen? Het project komt terug in de pool.")`.
   - Bij OK: `projects.update({ toegewezen_aan: null, toegewezen_op: null })` voor dit project.
   - Notificatie naar de oude eigenaar: `notificaties.insert({ user_id: oudeId, bericht: "Project «projectnaam» is bij je weggehaald en teruggeplaatst in de pool." })`.
   - Lokale state verversen (`setToegewezenNaam(null)`, `setToegewezenRol(null)`) en toast "Toewijzing losgekoppeld".

2. **EP-adviseur**
   - Prullenbakje verschijnt alleen als `project.adviseur_id` ingevuld is.
   - Klik → `confirm("EP-adviseur «naam» loskoppelen van dit project?")`.
   - Bij OK: `projects.update({ adviseur_id: null })`.
   - `setAdviseurNaam(null)` en toast "EP-adviseur losgekoppeld".

## Zichtbaarheid

- Alleen tonen voor gebruikers met rol **beheer** (via bestaande `useAuth().hasRole("beheer")`), zodat tekenaars/auditors niet per ongeluk koppelingen verbreken.

## UI-details

- Gebruik `Trash2` uit `lucide-react`, `Button size="icon" variant="ghost"` met `className="h-6 w-6 text-destructive hover:bg-destructive/10"`, `aria-label="Loskoppelen"`, `title` met dezelfde tekst.
- Plaats het knopje rechts naast de naam binnen dezelfde flex-rij; behoud bestaande typografie en spacing van de "Stand van zaken"-kaart.

## Wijzigingen

- **Bestand:** `src/components/projecten/BeheerStandVanZaken.tsx`
  - `Trash2` en `Button` importeren.
  - `useAuth` importeren voor de rolcheck.
  - Twee handlers toevoegen: `loskoppelToewijzing()` en `loskoppelAdviseur()`.
  - In de JSX van "Toegewezen" en "EP-adviseur" het prullenbakje renderen conform bovenstaande regels.
- Geen wijzigingen in backend, RLS of edge functions; bestaande update-rechten op `projects` voor beheer zijn voldoende.

## Verificatie

- Open een project als beheerder → twee prullenbakjes zichtbaar (alleen bij gevulde velden).
- Klik op het prullenbakje bij **Toegewezen**: bevestiging verschijnt; na bevestigen toont de regel "Pool — nog niet geclaimd" en oude eigenaar krijgt een notificatie.
- Klik op het prullenbakje bij **EP-adviseur**: bevestiging verschijnt; na bevestigen toont de regel "—".
- Als niet-beheer gebruiker: prullenbakjes zijn niet zichtbaar.
