

# Checklist deel-toewijzing bewerkbaar maken

## Doel
Een beheerpagina toevoegen waar je per checklist (EPW-B en EPW-D) kunt instellen welke items bij Deel 1 of Deel 2 horen, zonder de broncode te hoeven aanpassen.

## Aanpak

### Nieuwe pagina: `src/pages/ChecklistBeheer.tsx`
- Alleen toegankelijk voor gebruikers met de rol "beheer"
- Twee tabbladen: EPW-B en EPW-D
- Toont per checklist alle items in een tabel met kolommen: Code, Controlepunt, Onderdeel, Deel
- De kolom "Deel" bevat een toggle of dropdown (1 / 2) die direct de waarde in het geheugen aanpast
- Een "Opslaan"-knop schrijft de gewijzigde checklist terug naar de database

### Database: nieuwe tabel `checklist_templates`
Een tabel om de standaard deel-toewijzing per audit-categorie op te slaan, zodat wijzigingen persistent zijn:

```sql
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_categorie audit_categorie NOT NULL,
  code text NOT NULL,
  onderdeel text NOT NULL,
  controlepunt text NOT NULL,
  deel smallint NOT NULL DEFAULT 1,
  UNIQUE (audit_categorie, code)
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

-- Iedereen met een rol mag lezen
CREATE POLICY "Checklist templates select"
  ON public.checklist_templates FOR SELECT
  USING (has_any_role(ARRAY['beheer','tekenaar','auditor','ep_adviseur']));

-- Alleen beheer mag wijzigen
CREATE POLICY "Checklist templates manage"
  ON public.checklist_templates FOR ALL
  USING (has_role('beheer'))
  WITH CHECK (has_role('beheer'));
```

Bij eerste gebruik worden de huidige hardcoded waarden uit `epwb-checklist.ts` en `epwd-checklist.ts` als seed geinserteerd.

### Wijziging in `ProjectAanmaken.tsx`
Bij het aanmaken van een project worden de deel-waarden opgehaald uit `checklist_templates` in plaats van uit de hardcoded arrays. Fallback naar de hardcoded data als de tabel leeg is.

### Route toevoegen
- Nieuwe route `/checklist-beheer` in `App.tsx`
- Link toevoegen in de navigatie (alleen zichtbaar voor beheer)

### Samenvatting wijzigingen
| Bestand | Actie |
|---------|-------|
| Database migratie | Nieuwe tabel `checklist_templates` + RLS + seed data |
| `src/pages/ChecklistBeheer.tsx` | Nieuw: beheerpagina met tabel + deel-toggle |
| `src/pages/ProjectAanmaken.tsx` | Checklist ophalen uit DB i.p.v. hardcoded |
| `src/App.tsx` | Route toevoegen |
| `src/components/AppLayout.tsx` | Navigatielink toevoegen |

