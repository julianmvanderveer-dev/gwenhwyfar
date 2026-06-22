## Doel

In de Beheer-tab **Exports** aparte downloadknoppen per projectstatus, zodat beheerders gericht een groep projecten kunnen exporteren in plaats van één algemene lijst.

## Wijzigingen

### `src/components/projecten/AfgerondeProjectenExport.tsx` herzien (hernoemen naar `ProjectenExport.tsx`)

Eén Card "Projecten exporteren" met:

- Eén query bij mount: alle `projects` (zonder statusfilter), inclusief `adviseurs:adviseur_id(naam, email)`.
- Optionele filters bovenaan (compact): jaar (op `datum_aangemaakt` voor lopend, op `gearchiveerd_op` voor afgerond) + van/tot datum.
- Een lijst groepen, elk met een eigen telling en eigen "Download CSV"-knop:

  | Groep | Statussen | Datumveld voor filter |
  |---|---|---|
  | Nog te starten | `nog_niet_begonnen` | `datum_aangemaakt` |
  | Deel 1 bezig | `deel1_bezig` | `datum_aangemaakt` |
  | Deel 1 afgerond | `deel1_afgerond` | `datum_aangemaakt` |
  | Deel 2 bezig | `deel2_bezig` | `datum_aangemaakt` |
  | Wacht op reactie EP-adviseur | `wacht_op_reactie` | `reactie_deadline` |
  | Afgerond | `afgerond`, `gesloten` | `gearchiveerd_op` |

- Per groep: regel met label, telling (`X project(en)`), en knop **Download CSV** (disabled bij 0). Filename: `projecten-{groep-slug}-{jaar|selectie}.csv`.
- CSV-kolommen ongewijzigd t.o.v. huidige component (Projectnaam, Status (label), Categorie, Soort, Prioriteit Ja/Nee, Toelatingsaudit Ja/Nee, EP-adviseur, E-mail adviseur, Datum aangemaakt, Afgerond op). Voor groep "Wacht op reactie" extra kolom **Reactie-deadline**.

### `src/pages/Beheer.tsx`
- Import vervangen: `AfgerondeProjectenExport` → `ProjectenExport`.
- `TabsContent value="exports"` rendert `<ProjectenExport />` (label tab blijft "Exports").

## Niet gewijzigd

- DB, RLS, edge functions, andere Beheer-tabs, `ExportFilter` op de Projecten-pagina.
