

# Intern Auditplatform — Implementatieplan

## Overzicht
Een minimalistisch intern auditplatform met werkende workflow: rollen, statusovergangen, berichtenuitwisseling en notificaties. Puur functioneel, geen styling of dashboards.

---

## Fase 1: Database & Authenticatie

### Supabase Setup
- **Authenticatie** via Supabase Auth (email/wachtwoord login)
- **Profieltabel** met naam en actief-status
- **Rollentabel** (apart van profiel, conform security best practices) met rollen: `planner`, `tekenaar`, `ep_adviseur`, `adviseur`, `beheer`

### Tabellen
1. **profiles** — id, naam, email, actief
2. **user_roles** — user_id, role (enum)
3. **projects** — id, projectnaam, adviseur_id, audit_type (intern/extern), prioriteit, status (enum met 6 waarden), aangemaakt_door, datum_aangemaakt
4. **findings** — id, project_id, onderdeel, controlepunt, beoordeling (goed/niet_goed/interne_alert), type_afwijking (kritiek/niet_kritiek), deadline, eigenaar_beoordeling (tekenaar/ep_adviseur), status (open/reactie_ontvangen/gesloten), zichtbaar_voor_adviseur
5. **messages** — id, finding_id, afzender_id, bericht, datum

### RLS-beleid
- **Planner**: projecten aanmaken, alles inzien
- **Tekenaar**: deel 1 velden bewerken, findings zien
- **EP-adviseur**: deel 2 velden bewerken, findings beoordelen
- **Adviseur**: alleen eigen projecten + reageren op findings
- **Beheer**: volledige toegang
- Security definer functies om rol-checks zonder recursie te doen

---

## Fase 2: Schermen

### Login
- Eenvoudig email/wachtwoord loginformulier
- Na login: doorsturen naar Inbox op basis van rol

### Inbox
- Overzicht van "mijn open werk" per rol:
  - Planner ziet projecten die actie nodig hebben
  - Tekenaar ziet projecten in `deel1_bezig`
  - EP-adviseur ziet projecten in `wacht_op_deel2`
  - Adviseur ziet findings met status `open` (eigen projecten)
  - Beheer ziet alles

### Projectdetail
- Tabbladen per onderdeel
- Per controlepunt: selectie goed / niet goed / interne alert
- Knop **"Deel 1 afronden"** (alleen zichtbaar voor tekenaar) → status naar `wacht_op_deel2`
- Knop **"Audit afronden"** (alleen zichtbaar voor EP-adviseur) → deadlines berekenen, status naar `reactie_open`, notificatie versturen

### Reactiepagina (per finding)
- Toont oorspronkelijke afwijking met details
- Reactieveld voor adviseur
- Knop **"Reactie verzenden"** → finding.status = `reactie_ontvangen`, notificatie naar eigenaar_beoordeling

### Beoordelingspagina
- Toont volledige berichtenthread
- Knop **"Akkoord"** → finding.status = `gesloten`
- Knop **"Niet akkoord"** → status blijft `open`, adviseur opnieuw genotificeerd
- Automatische check: als alle findings gesloten → project.status = `gesloten`

---

## Fase 3: Logica & Notificaties

### Statusovergangen
- Project: `geselecteerd` → `deel1_bezig` → `wacht_op_deel2` → `afgerond` → `reactie_open` → `gesloten`
- Finding: `open` → `reactie_ontvangen` → `gesloten`

### Deadline-berekening bij audit afronden
- Kritieke afwijking: deadline = vandaag + 28 dagen
- Niet-kritieke afwijking: deadline = vandaag + 3 maanden

### Notificaties
- Edge function voor het versturen van notificatie-emails:
  - Bij audit afronden → mail naar adviseur met link
  - Bij reactie verzenden → mail naar eigenaar_beoordeling
- In-app notificaties als fallback (toast/inbox indicator)

### Auto-sluiting
- Bij elke finding-statuswijziging: check of alle findings van het project gesloten zijn → zo ja, project.status = `gesloten`

---

## Fase 4: Beheer

### Gebruikersbeheer (rol: beheer)
- Gebruikers toevoegen/deactiveren
- Rollen toewijzen
- Overzicht van alle projecten en findings

