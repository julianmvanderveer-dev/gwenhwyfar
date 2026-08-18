# Herafmelding verplicht bij blijvende KT

Als een audit na de reactieronde nog steeds op **KT** staat, mag het project niet meer direct worden afgerond. De EP-adviseur moet dan eerst bewijs van een nieuwe afmelding (nieuw label als PDF) uploaden, en de auditor moet dat goedkeuren. Pas daarna gaat de audit naar Afgerond.

## Nieuwe stap in de workflow

```text
alle bevindingen beoordeeld
        |
   EP2 = KT ? -- nee --> Afgerond (zoals nu)
        | ja
Wacht op herafmelding  (EP-adviseur uploadt nieuw label, PDF)
        |
Herafmelding ingediend (auditor beoordeelt)
        |
   goedgekeurd --> Afgerond      afgekeurd --> terug naar EP-adviseur, nieuwe upload
```

## Wat de EP-adviseur ziet

Op de projectpagina verschijnt een blok "Nieuwe afmelding vereist" met uitleg dat de audit als kritiek (KT) is beoordeeld, een upload-veld voor de PDF van het nieuwe label en een optioneel toelichtingsveld. Na uploaden ziet hij de status "In behandeling bij auditor". Bij afkeuring ziet hij de reden van de auditor en kan hij opnieuw uploaden.

De adviseur krijgt een e-mail zodra de herafmelding vereist is, en een e-mail bij goedkeuring of afkeuring.

## Wat de auditor ziet

In hetzelfde blok: de geüploade PDF (downloadlink), datum, en twee knoppen — "Goedkeuren" (project gaat naar Afgerond) en "Afkeuren" (met verplichte reden, adviseur moet opnieuw uploaden). Zolang de herafmelding niet is goedgekeurd, blijft het project zichtbaar als openstaand en kan het niet worden gesloten.

Projecten die op herafmelding wachten krijgen een eigen fase-kolom in het projectenoverzicht en tellen niet mee als afgerond.

## Technische uitwerking

**Database**
- Nieuwe waarde `wacht_op_herafmelding` in de enum `project_status`.
- Nieuwe tabel `herafmeldingen`: `id`, `project_id`, `bestandsnaam`, `bestand_pad`, `toelichting`, `status` (`ingediend` | `goedgekeurd` | `afgekeurd`), `afkeur_reden`, `ingediend_door`, `beoordeeld_door`, `beoordeeld_op`, `created_at`. Inclusief GRANTs, RLS aan, en policies: EP-adviseur van het project mag inserten/lezen, interne rollen (beheer/auditor/tekenaar) mogen lezen en updaten.
- PDF's in de bestaande private bucket `project-documents` onder `herafmelding/{project_id}/...`.
- De trigger `auto_finish_project_on_finding_close` wordt aangepast: bij `ep2_beoordeling = 'kt'` zet hij het project op `wacht_op_herafmelding` in plaats van `afgerond`.

**Frontend**
- `src/hooks/useBatchVersturen.ts`: bij het afronden na de laatste beoordeling controleren op KT; dan status `wacht_op_herafmelding` + notificatie/e-mail naar de adviseur in plaats van afronden.
- Nieuwe component `src/components/projecten/Herafmelding.tsx` met beide rolweergaves, ingebouwd in `src/pages/ProjectDetail.tsx`.
- `src/lib/badges.tsx`, `src/components/projecten/faseConfig.ts` en `FaseTabel.tsx`: label en fase-kolom voor de nieuwe status.
- Goedkeuring door de auditor zet het project op `afgerond` + `gearchiveerd_op` en stuurt de bestaande afrondingsmail.

**E-mail**
- Nieuwe transactionele templates `herafmelding-vereist` en `herafmelding-beoordeeld` (goedgekeurd/afgekeurd), geregistreerd in de bestaande registry; verzending via de bestaande `notify-adviseur` functie.

**Functiescheiding**
- De bestaande regel blijft gelden: is de ingelogde gebruiker EP-adviseur van het project, dan ziet hij alleen het upload-deel, nooit de goedkeurknoppen.
