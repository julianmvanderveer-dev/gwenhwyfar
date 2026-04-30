# Correctie backfill reactie_deadline

## Probleem
Tijdens de vorige migratie zijn alle lopende projecten met status `wacht_op_reactie` op een nieuwe `reactie_deadline` van **+14 dagen vanaf nu** gezet. Dat is verkeerd: de regel is dat de deadline 2 weken ná de laatste actie ligt (originele audit afronding) of 1 week na een afkeuring. Voor Bruggenhoofd Nijkerk (en de twee Wooldseweg-projecten) ligt die laatste actie eind april 2026, dus de deadline zou nu al verstreken moeten zijn — en de adviseur had inmiddels herinneringsmails moeten ontvangen.

## Aanpak

Voor elk lopend project (`status = 'wacht_op_reactie'`) bepalen we de **laatste actie-datum** en zetten daar de juiste deadline op:

1. **Bepaal "laatste actie"** per project = max van:
   - `datum_aangemaakt` van het project
   - `goedgekeurd_op` van findings (auditor heeft beoordeeld → start van de 2-weken-termijn)
   - `datum` van de laatste `messages` afkomstig van een Auditor/Tekenaar/Beheer (auditor-reactie op adviseur → start van 1-weken-termijn)

2. **Bepaal termijn**:
   - Standaard: 2 weken (originele audit-cyclus)
   - Als de laatste actie een auditor-reactie ná een eerdere adviseur-reactie was: 1 week

3. **Reset reminder-flags** opnieuw, maar realistisch:
   - Als de berekende deadline al > 21 dagen verstreken: zet alle flags op `true` behalve de eindwaarschuwing → die laatste mag morgen vanzelf gestuurd worden.
   - Beter (eenvoudiger en transparanter): zet álle reminder-flags op `false`. De cron-job die morgenochtend draait stuurt dan in één keer de juiste mail (T+7, T+14 of T+21) op basis van de échte deadline. Geen email-spam want elke flag wordt apart gecheckt en maar één mail per dag per project gestuurd.

   Ik kies voor optie 2 (alle flags `false`) omdat het simpel en correct is.

## Concrete stappen

1. **SQL data-update** (via insert tool, geen migratie):
   ```sql
   WITH laatste_actie AS (
     SELECT
       p.id AS project_id,
       GREATEST(
         p.datum_aangemaakt,
         COALESCE((SELECT MAX(f.goedgekeurd_op) FROM findings f WHERE f.project_id = p.id), p.datum_aangemaakt),
         COALESCE((
           SELECT MAX(m.datum)
           FROM messages m
           JOIN findings f ON f.id = m.finding_id
           JOIN user_roles ur ON ur.user_id = m.afzender_id
           WHERE f.project_id = p.id
             AND ur.role IN ('auditor','tekenaar','beheer')
         ), p.datum_aangemaakt)
       ) AS actie_datum
     FROM projects p
     WHERE p.status = 'wacht_op_reactie'
   )
   UPDATE projects p
   SET reactie_deadline = la.actie_datum + INTERVAL '14 days',
       reminder_pre_sent = false,
       reminder_overdue_1w_sent = false,
       reminder_overdue_2w_sent = false,
       reminder_overdue_3w_sent = false
   FROM laatste_actie la
   WHERE p.id = la.project_id;
   ```
   (Termijn 14 dagen voor de eenvoud — de exacte 7/14-onderscheid is moeilijk retroactief vast te stellen zonder duidelijke "afkeur"-trigger in de berichten-historie. Voor toekomstige cycli zorgt de bestaande code wél voor het juiste verschil.)

2. **Verificatie**: na de update een SELECT draaien om te tonen welke deadlines en welke escalatie-tier (T-1, T+7, T+14, T+21) elk project nu heeft.

3. **Cron**: de bestaande dagelijkse cron `reactie-herinneringen-daily` (07:00 UTC) doet de rest — morgenochtend gaan er per project de juiste herinneringsmails uit (CC `julian@borgch.nl`).

## Resultaat na correctie
- Bruggenhoofd Nijkerk: laatste auditor-actie ~24-4-2026 → deadline ~8-5-2026 → vandaag dus dichtbij T-1 of T+0.
- Wooldseweg 107b: laatste actie ~29-4-2026 → deadline ~13-5-2026 → nog ruim binnen termijn.
- Wooldseweg 107c: laatste actie ~23-4-2026 → deadline ~7-5-2026 → bijna T-1.

(Exacte uitkomst hangt af van wie de laatste berichten stuurde — wordt zichtbaar in de verificatie-query.)

## Wijzigingen in code
Geen — alleen een data-correctie. De bestaande edge function en cron blijven ongewijzigd.
