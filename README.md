# Centje

Een persoonlijke financiële app (PWA) om inkomsten, uitgaven, budgetten en
spaardoelen bij te houden. Gemaakt om één ding heel goed te doen: **binnen
10 seconden een uitgave invoeren** — app openen, bedrag typen, categorie
tikken, opslaan — en meteen zien hoeveel budget er nog over is.

Alle data blijft op het toestel (IndexedDB via Dexie). Geen account, geen
backend, geen tracking, werkt volledig offline.

## Functies

- **Toevoegen-scherm** met eigen cijferblok direct in beeld, categorietegels
  (meest gebruikt bovenaan), snelknoppen voor terugkerende uitgaven en
  "Ongedaan maken" na elke opslag.
- **Vandaag**: vrij besteedbaar deze maand, saldo, inkomsten en uitgaven,
  voortgangsbalken per categorie, spaardoelen en de laatste transacties.
- **Budget**: per categorie budget, uitgegeven, restant, percentage en een
  prognose voor het einde van de maand, met maandnavigatie.
- **Doelen**: spaardoelen met streefdatum, benodigde inleg per maand en
  "Inleg boeken" in één tik.
- **Overzicht**: jaarcijfers, inkomsten per maand, uitgaven per categorie,
  top 5 uitgaven en totalen per werkgever.
- **Inkomsten** met werkgever en uren; uren × uurloon vult het bedrag voor.
- **Back-up**: exporteren naar JSON, terugzetten uit JSON en exporteren naar
  CSV voor Excel.
- **Demodata**-knop om de app gevuld te bekijken, met één knop weer te wissen.
- Licht en donker thema, Nederlands, eurobedragen met komma, weekstart maandag.

## Techniek

Vite · React · TypeScript (strict) · Tailwind CSS · shadcn/ui · Dexie
(IndexedDB) · Recharts · vite-plugin-pwa · Vitest

## Installatie

Vereist: [Node.js](https://nodejs.org/) 20 of nieuwer.

```sh
npm install       # afhankelijkheden installeren
npm run dev       # ontwikkelserver op http://localhost:8080
npm test          # alle rekenregels en de back-up doorlopen de tests
npm run build     # productie-build in dist/
npm run preview   # de productie-build lokaal bekijken
```

## Deployen

De app is een statische site; de map `dist/` is alles wat er nodig is.

**Netlify**

1. Repository koppelen op [netlify.com](https://www.netlify.com/).
2. Build command: `npm run build`, publish directory: `dist`.
3. Het bestand `public/_redirects` zorgt er al voor dat alle routes naar de
   app wijzen.

**Vercel**

1. Repository importeren op [vercel.com](https://vercel.com/).
2. Framework: Vite (wordt automatisch herkend), build `npm run build`,
   output `dist`.
3. `vercel.json` regelt de routes.

## Op je telefoon installeren

Open de site in de browser van je telefoon:

- **iPhone (Safari)**: deelknop → "Zet op beginscherm".
- **Android (Chrome)**: menu (⋮) → "App installeren" of "Toevoegen aan
  startscherm".

Daarna werkt Centje als losse app, ook zonder internet.

## Back-up — belangrijk

Alle gegevens staan alleen in de browseropslag van het toestel. Wordt die
gewist, dan is alles weg. Maak daarom regelmatig een back-up via
**Instellingen → Back-up maken (JSON)** en bewaar dat bestand ergens veilig
(bijvoorbeeld in een clouddrive). Terugzetten kan via **Back-up terugzetten**.
