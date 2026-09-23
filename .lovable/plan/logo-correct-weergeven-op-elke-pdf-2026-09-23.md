# Logo correct weergeven + op elke PDF

## Wat er nu misgaat

Het logo in het platform is geen echte kopie van het BengCert-logo: het is nagetekend als twee groene vinkjes naast de naam. Het echte logo bestaat uit één vinkje opgebouwd uit drie over elkaar liggende lagen (geel/oranje, groen, blauw) mét de naam **eronder** in donkerblauw. Daardoor kloppen zowel de kleuren als de verhouding niet.

## Wat ik ga doen

### 1. Het logo natekenen zoals het echt is
- Het aangeleverde logo wordt als vectorversie nagebouwd: het gelaagde vinkje in de juiste kleuren (geel, oranje, groen, blauw) en de naam "bengcert" in donkerblauw (#28235D), in dezelfde verhoudingen als het origineel.
- Twee uitvoeringen:
  - **Staand** (vinkje boven de naam) — zoals het echte logo, voor inlogscherm en PDF's.
  - **Liggend** (vinkje links van de naam) — voor de smalle donkerblauwe balk bovenin, waar hoogte beperkt is. Daar wordt de naam wit weergegeven, het vinkje behoudt zijn kleuren.
- Het logo blijft scherp op elk formaat en heeft een transparante achtergrond, dus geen wit blokje meer op de donkerblauwe balk.
- Ook het browsericoon (tabblad) wordt op dit logo gezet.

### 2. Logo klein rechtsboven op iedere PDF
- In het auditrapport verhuist het logo van linksboven naar **rechtsboven**, klein (ca. 18 mm breed). De titel "Auditrapport" en de projectnaam komen links te staan.
- Hetzelfde logo komt rechtsboven op de overige uitdraaien: de foutenanalyse-uitdraai en de bulk-PDF-export.
- Werkt ook zonder internetverbinding in de PDF-generator, omdat het logo als vector in het document zelf zit.

### 3. Eigen logo blijft mogelijk
Is er in Beheer een eigen logo ingesteld, dan blijft dat voorrang houden — zowel op het scherm als op de PDF's.

## Technisch

- `src/components/BengCertLogo.tsx` wordt herschreven naar een getrouwe SVG met `layout="stacked" | "inline"`, correcte paden voor de drie vinkjeslagen en de juiste merkkleuren; `AppLogo.tsx` geeft de layout door.
- `src/components/AppLayout.tsx` en `src/pages/Login.tsx` krijgen de passende layout mee.
- De geüploade afbeelding wordt via `lovable-assets` als pointer opgeslagen voor referentie/fallback; `public/favicon.png` wordt vierkant bijgesneden uit het vinkje en `index.html` verwijst ernaar.
- `src/lib/generateAuditReport.ts`: `BENGCERT_LOGO_SVG` vervangen door de correcte inline-SVG, header-tabel omgezet naar titel links / logo rechts (`text-align:right`, hoogte ~48px).
- `src/components/beheer/FoutenAnalyse.tsx` en `src/components/projecten/BulkPdfExport.tsx` krijgen dezelfde header-logo rechtsboven via een gedeelde helper in `src/lib/reportLogo.ts`.
