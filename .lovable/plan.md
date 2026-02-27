

# CSV-export vanuit Beheer-pagina

## Wat wordt gebouwd
Een "Exporteer" knop op de Beheer-pagina die twee CSV-bestanden genereert:
1. **Gebruikers.csv** — naam, e-mail, actief, en welke rollen (ja/nee per rol)
2. **Projecten.csv** — projectnaam, status, categorie, soort, prioriteit, adviseur, datum aangemaakt

## Implementatiestappen

### 1. CSV-hulpfunctie aanmaken
Een `src/lib/csv.ts` bestand met een generieke functie die een array van objecten omzet naar CSV-tekst en als bestand download (client-side, geen backend nodig).

### 2. Beheer-pagina uitbreiden
- Projectdata ophalen (naast de bestaande gebruikersdata)
- Twee knoppen toevoegen: "Export gebruikers" en "Export projecten" (of een enkele knop die beide downloadt)
- Bij klik: CSV genereren uit de geladen data en als `.csv` downloaden

### 3. Rolcontrole
Alleen zichtbaar voor gebruikers met de `beheer`-rol (bestaande check is al aanwezig).

## Technische details
- Puur client-side export via `Blob` + `URL.createObjectURL` — geen extra dependencies nodig
- CSV met puntkomma-separator (`;`) voor goede Excel-compatibiliteit in NL
- Projectdata wordt opgehaald via `supabase.from("projects").select("*, adviseurs(naam)")` om de adviseurnaam mee te nemen

