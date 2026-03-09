

## Plan: Projectdetail — altijd alle posten tonen + redesign

### Probleem
De pagina toont "Nog geen findings voor dit onderdeel" als er geen findings zijn. De gebruiker wil altijd álle controlepunten uit de checklist-templates zien als rijen, ongeacht of er al findings bestaan. Daarnaast moet het ontwerp professioneler in bengcert.nl-stijl.

### Wijzigingen in `src/pages/ProjectDetail.tsx`

#### 1. Alle controlepunten laden uit templates
- Niet alleen `onderdeel` ophalen, maar de volledige `checklist_templates` data (code, onderdeel, controlepunt, deel) voor de `audit_categorie`
- Per tab/onderdeel: toon alle template-rijen als basis, en merge bestaande findings erbij (match op controlepunt + deel)
- Geen "Nog geen findings" melding meer — elke rij is altijd zichtbaar met lege beoordeling als er nog geen finding is

#### 2. Auto-create finding bij beoordeling
- Als een gebruiker een beoordeling invult op een rij waar nog geen finding bestaat, automatisch een finding aanmaken via `supabase.from("findings").insert(...)` en daarna herladen

#### 3. Redesign in bengcert.nl-stijl
- **Header**: Card met projectnaam, status-badge (kleurgecoord), metadata in nette grid
- **Tabs**: Stijl consistent met Beheer-pagina (shadow-sm, bg-card, rounded-lg border)
- **Tabel**: Gebruik dezelfde styling als Beheer (bg-secondary/60 headers, alternerende rijkleuren, hover states)
- **EP2 tab**: Card-layout met nettere spacing
- **Actieknoppen**: Onderaan in een card-footer met betere visuele hiërarchie
- **Status badges**: Kleurgecodeerd (groen=goed, rood=niet_goed, oranje=interne_alert)

### Geen database-wijzigingen nodig

