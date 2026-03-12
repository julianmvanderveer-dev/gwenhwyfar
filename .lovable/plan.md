

## Dashboard voor Tekenaar/Auditor

De huidige Inbox-pagina toont voor tekenaars/auditors dezelfde fase-tabellen als voor beheer. Dit wordt vervangen door een eenvoudig twee-tabbladen dashboard, exclusief voor tekenaar/auditor rollen. Beheer behoudt het huidige overzicht ongewijzigd.

### Wijzigingen

**Bestand: `src/pages/Inbox.tsx`**

De `isInternal`-sectie (regels 253-332) wordt opgesplitst: beheer behoudt het huidige overzicht met fase-tabellen, zoekbalk en export. Voor tekenaar/auditor wordt een nieuw blok gerenderd met twee tabbladen:

**Tabblad "Findings"** (default):
- Query: findings met `eigenaar_beoordeling` = rol van gebruiker EN `status` = `reactie_ontvangen`
- Verrijkt met projectnaam (join projects) en adviseursnaam (join projects → adviseurs)
- Verrijkt met laatst ontvangen reactie-datum en inhoud via de `messages` tabel (meest recente bericht per finding waar de afzender een EP-adviseur is)
- Gesorteerd op datum meest recente reactie, aflopend
- Kolommen: Projectnaam, EP-adviseur, Reactie (samenvatting), Datum, Actie-link ("Beoordelen")
- Lege staat: "Er zijn momenteel geen openstaande findings."
- Badge op tabblad-trigger met telling openstaande findings

**Tabblad "Mijn projecten"**:
- Query: projecten waar `toegewezen_aan = user.id` OF (`toewijzing = 'pool'` EN `toegewezen_aan IS NULL`)
- Filter: `status != 'gesloten'` en `status != 'afgerond'`
- Kolommen: Projectnaam, Type (audit_categorie), Start-knop (voor `nog_niet_begonnen`)
- Projecten die al gestart zijn door de gebruiker tonen "Openen" link i.p.v. "Start"
- Geen admin-kolommen

**Data loading** — Aparte functie `loadMedewerkerData()`:
- Laadt findings met project+adviseur join
- Laadt meest recente message per finding voor reactie-inhoud
- Laadt beschikbare projecten (RLS filtert automatisch)

**Geen wijzigingen aan**: database schema, RLS policies, FaseTabel, of beheer-overzicht.

### Betrokken bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Inbox.tsx` | Conditioneel renderen: beheer → huidig overzicht; tekenaar/auditor → nieuw 2-tabbladen dashboard |

