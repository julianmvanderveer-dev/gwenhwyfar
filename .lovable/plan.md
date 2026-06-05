## Doel
Voeg in alle audit-gerelateerde mails aan EP-adviseurs een knop "Bekijk de audit" toe die direct naar `https://www.bengaudit.nl/project/{projectId}` linkt.

## Status
- `audit-afgerond.tsx` — heeft de link al, ongewijzigd.
- 5 templates missen de link en moeten worden uitgebreid:
  - `niet-akkoord.tsx`
  - `reactie-herinnering-pre.tsx`
  - `reactie-herinnering-waarschuwing.tsx`
  - `reactie-herinnering-eindwaarschuwing.tsx`
  - `reactie-herinnering-overdue.tsx`

## Wijzigingen

### 1. Templates (5×)
Voeg in elk van bovenstaande templates toe, naar voorbeeld van `audit-afgerond.tsx`:
- `projectId?: string` aan props
- `auditUrl = projectId ? '${SITE_URL}/project/${projectId}' : SITE_URL`
- `<Section>` met `<Button href={auditUrl}>Bekijk de audit</Button>` vlak voor de afsluiting
- Knop-styling (`backgroundColor: '#5AAF2D'`, etc.) consistent met audit-afgerond
- `projectId` toevoegen aan `previewData`

### 2. Edge function `reactie-herinneringen/index.ts`
In de `templateData` (regel ~123) `projectId: p.id` toevoegen, zodat de herinneringsmails de juiste link kunnen renderen. `notify-adviseur` geeft `projectId` al door — geen wijziging nodig.

## Niet in scope
- Auditor-gerichte templates (`audit-afgerond-auditor`, `reactie-ontvangen-auditor`) — gebruiker vroeg expliciet om EP-adviseur-mails.
- Geen schema- of databasewijzigingen.
