

# BengCert logo toevoegen

## Analyse van het logo

Op bengcert.nl is het logo te zien: twee overlappende groene vinkjes (checkmarks) links, gevolgd door de tekst "beng" in donkerblauw (#1B2A4A) en "cert" in groen (#7AB929). Het logo op de website is een PNG — er is geen publieke SVG beschikbaar.

## Plan

### 1. SVG logo-component aanmaken (`src/components/BengCertLogo.tsx`)
Een React-component dat het logo als inline SVG rendert:
- Twee overlappende groene vinkjes (checkmarks) links
- Tekst "beng" in donkerblauw, "cert" in groen
- Props voor `size` (schaalt proportioneel) en `variant` (`light` voor op donkere achtergrond waar "beng" wit wordt, `dark` voor standaard)

### 2. AppLayout.tsx updaten
- `Shield` icoon verwijderen
- `BengCertLogo` importeren met `variant="light"` (witte "beng" tekst op donkere navbar)

### 3. Login.tsx updaten
- `Shield` icoon verwijderen
- `BengCertLogo` importeren met `variant="dark"` (donkerblauwe "beng" tekst op witte card)

### Bestanden

| Bestand | Wijziging |
|---|---|
| `src/components/BengCertLogo.tsx` | **Nieuw** — SVG logo-component met twee vinkjes + tekst |
| `src/components/AppLayout.tsx` | Shield → BengCertLogo (light variant) |
| `src/pages/Login.tsx` | Shield → BengCertLogo (dark variant) |

