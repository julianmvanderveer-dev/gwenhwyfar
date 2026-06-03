## Doel

Een EP-adviseur ziet nu élk project waaraan hij gekoppeld is, ook als de auditor/tekenaar nog bezig is. Dat is verwarrend (hij kan immers niets doen). Aanpassen zodat een EP-adviseur een project pas ziet wanneer er om zijn reactie gevraagd wordt, plus afgeronde projecten gedurende 14 dagen na afronding.

## Wijzigingen

### 1. RLS-policy `Projects select` aanpassen (migration)

Het EP-adviseur-deel van de SELECT-policy op `public.projects` wordt aangescherpt zodat hij alleen projecten ziet die:

- gekoppeld zijn aan zijn `adviseur_id`, EN
- ofwel status = `wacht_op_reactie` hebben, ofwel status `afgerond`/`gesloten` met `gearchiveerd_op >= now() - interval '14 days'`.

De policies voor beheer/tekenaar/auditor blijven ongewijzigd.

### 2. Frontend opschonen

- **`src/components/dashboard/AdviseurSectie.tsx`** (en eventuele andere adviseur-views): bestaande query op `projects` blijft werken — RLS doet het filter. Controleren dat geen UI-tekst belooft "lopende projecten" te tonen; labels eventueel bijstellen naar "Projecten die je aandacht vragen" + "Recent afgeronde projecten".
- Geen wijziging in findings-RLS nodig: findings zijn pas zichtbaar voor de adviseur als `zichtbaar_voor_adviseur = true`, wat hand-in-hand gaat met de `wacht_op_reactie`-fase.

### 3. Te verifiëren na uitvoering

- EP-adviseur die een lopend project heeft in status `deel1_bezig`/`deel2_bezig` ziet het project niet meer in zijn overzicht.
- Zodra de auditor de audit verzendt (status → `wacht_op_reactie`) verschijnt het project.
- Na afronding blijft het project 14 dagen zichtbaar, daarna verdwijnt het.

## Technische details

Nieuwe expressie voor het EP-adviseur-deel:

```sql
has_role('ep_adviseur') AND EXISTS (
  SELECT 1 FROM adviseurs
  WHERE adviseurs.id = projects.adviseur_id
    AND adviseurs.user_id = auth.uid()
) AND (
  projects.status = 'wacht_op_reactie'
  OR (
    projects.status IN ('afgerond', 'gesloten')
    AND projects.gearchiveerd_op IS NOT NULL
    AND projects.gearchiveerd_op >= now() - interval '14 days'
  )
)
```

Geen schemawijzigingen, alleen `DROP POLICY` + `CREATE POLICY` op `public.projects` voor SELECT.
