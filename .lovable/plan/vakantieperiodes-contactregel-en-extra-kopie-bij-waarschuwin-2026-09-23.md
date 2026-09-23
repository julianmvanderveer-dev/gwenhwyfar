# Vakantieperiodes, contactregel en extra kopie bij waarschuwingen

## Wat er verandert

1. **Bouwvak- en kerstvakantie tellen niet mee**
   Bij het bepalen of een reactietermijn 1, 2 of 3 weken is overschreden, worden de dagen die in de bouwvak- of kerstvakantie vallen overgeslagen. Een audit waarvan de termijn midden in de bouwvak verloopt, schuift dus automatisch op in plaats van meteen in de waarschuwingsreeks te belanden.

2. **Geen mails tijdens die periodes**
   Valt de dagelijkse controle binnen de bouwvak of kerstvakantie, dan worden er geen herinneringen of waarschuwingen verstuurd. Zodra de periode voorbij is, pakt de controle de draad gewoon weer op (er wordt niets ingehaald of dubbel verstuurd).

3. **Contactregel in iedere waarschuwingsmail**
   Onderaan alle vier de herinnerings- en waarschuwingsmails komt een vaste regel:
   *"Lukt het inloggen niet of heeft u vragen over deze audit? Neem dan contact op met BengCert via info@bengcert.nl."*

4. **Extra kopie bij de eindwaarschuwing**
   De eindwaarschuwing (3 weken na de deadline) gaat voortaan ook in kopie naar info@bengcert.nl, naast de bestaande kopie aan julian@borgch.nl. De eerdere drie mails blijven ongewijzigd qua ontvangers.

## Gekozen periodes

- **Bouwvak**: automatisch berekend, van de vroegste regiostart tot en met de laatste regio-einddatum. Regel: van zaterdag vóór week 29 tot en met de zondag die week 34 afsluit (circa half juli tot eind augustus). Dit dekt de regio's Zuid, Midden en Noord samen.
- **Kerstvakantie**: 21 december tot en met 5 januari.

Beide periodes staan als één duidelijke instelling in de code, zodat ze per jaar makkelijk bij te stellen zijn als de officiële data afwijken.

## Technische uitwerking

- Nieuw gedeeld bestand `supabase/functions/_shared/vakantieperiodes.ts`:
  - `bouwvakPeriode(jaar)` — berekent start/eind uit ISO-weeknummers 29 t/m 34.
  - `kerstPeriode(jaar)` — 21 dec t/m 5 jan.
  - `isInVakantie(datum)` — true binnen een van beide periodes.
  - `vakantieDagenTussen(van, tot)` — aantal dagen in die periodes, om van de verstreken tijd af te trekken.
- `supabase/functions/reactie-herinneringen/index.ts`:
  - Direct na start: `if (isInVakantie(now)) return { skipped: "vakantie" }` — geen enkele mail.
  - De `match`-functies van de tiers gebruiken een effectieve verstreken tijd: `now - deadline - vakantieDagenTussen(deadline, now)`. De pre-herinnering (1 dag vóór deadline) gebruikt dezelfde correctie.
  - Alleen bij tier `reminder_overdue_3w_sent`: `cc: "julian@borgch.nl, info@bengcert.nl"`.
- Contactregel toevoegen als extra `<Text>` blok (klein, grijs, boven de afsluiting) in:
  `reactie-herinnering-pre.tsx`, `reactie-herinnering-overdue.tsx`, `reactie-herinnering-waarschuwing.tsx`, `reactie-herinnering-eindwaarschuwing.tsx`.
- Edge function `reactie-herinneringen` opnieuw uitrollen; cron-schema blijft ongewijzigd.
