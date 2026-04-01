

# Restyling voorstel: BengCert huisstijl toepassen

## Analyse bengcert.nl

Uit de website blijken de volgende brandingkeuzes:

```text
Kleuren:
- Donkerblauw (navy):  #1B2A4A (header, tekst, achtergronden)
- Groen (primair):     #7AB929 (logo vinkje, accenten, CTA-knoppen)
- Blauw gradient:      #1B3A6B → #2E7DD1 (hero-secties)
- Wit:                 #FFFFFF (cards, achtergronden)
- Goud/geel:           #F5A623 (iconen, accenten)

Typografie:
- Schreefloos, modern (lijkt op Poppins/Montserrat)
- Duidelijke hiërarchie: vet/groot voor koppen, licht voor body

Stijlkenmerken:
- Clean, professioneel, corporate
- Witte cards met subtiele schaduwen
- Afgeronde knoppen met groene achtergrond
- Blauwe gradiënt hero-secties
- Gele/gouden iconen als visueel accent
```

## Huidige staat platform

De app gebruikt al een groen/blauw kleurenpalet, maar wijkt af:
- Rolgebaseerde achtergrondkleuren (geel, blauw, groen per rol) — niet in lijn met bengcert
- Navigatiebalk is kaal en minimaal
- Login-pagina mist branding volledig
- Geen logo, geen gradient hero, geen visuele identiteit

## Voorstel wijzigingen

### 1. CSS variabelen updaten (`src/index.css`)
- `--primary` aanpassen naar bengcert-groen (#7AB929)
- `--foreground` naar donkerblauw (#1B2A4A)
- `--sidebar-background` naar bengcert navy
- `--accent` naar bengcert blauw (#2E7DD1)
- Nieuwe `--gradient-hero` voor blauwe gradiënt-secties

### 2. Navigatiebalk restylen (`AppLayout.tsx`)
- Donkerblauwe achtergrond met witte tekst (zoals bengcert.nl header)
- Logo linksboven toevoegen (tekst-logo "bengcert" of SVG)
- Navigatielinks met hover-effect in groen
- "Contact" / actie-knop rechts met groene pill-stijl
- Rolgebaseerde achtergrondkleuren verwijderen (altijd wit/lichtgrijs)

### 3. Login-pagina redesign (`Login.tsx`)
- Blauwe gradiënt-achtergrond (zoals bengcert hero)
- Witte card gecentreerd met schaduw
- Logo boven het formulier
- Groene primaire knop

### 4. Cards en tabellen
- Cards: witte achtergrond, subtiele border, lichte schaduw (al grotendeels goed)
- Knoppen: groene primaire kleur, afgerond
- Badges: gouden/gele accenten voor waarschuwingen behouden

### 5. Algemeen
- Font wijzigen naar Poppins of Montserrat (dichter bij bengcert)
- Consistente border-radius (8px, al ingesteld)

## Bestanden die wijzigen

| Bestand | Wat |
|---|---|
| `src/index.css` | CSS variabelen, font-import |
| `src/components/AppLayout.tsx` | Navbar restyling, logo, rolkleuren weg |
| `src/pages/Login.tsx` | Gradient achtergrond, card-layout, logo |
| `tailwind.config.ts` | Eventuele gradient utilities |
| `index.html` | Google Fonts link (Poppins) |

## Wat niet wijzigt

- Functionaliteit, routes, database, componenten-logica
- UI-componenten (shadcn) — alleen kleurvariabelen

