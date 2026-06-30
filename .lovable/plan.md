## Probleem

Project `W26.044 ... bwnr 026` (ID `66068f45-...`) staat in de pool met:
- `status = 'wacht_op_reactie'`
- `toewijzing = 'pool'`, `toegewezen_aan = NULL` (gevolg van de eerdere data-fix)
- 1 finding heeft `reactie_ontvangen`, dus er ligt werk voor een auditor

Andere auditors zien het project wel in hun overzicht ("ter beoordeling auditor"), maar zodra ze het openen gebeurt er niets:

`autoSetStatus()` in `src/pages/ProjectDetail.tsx` roept `claim_project` alléén aan wanneer de status `nog_niet_begonnen` of `deel1_afgerond` is. Bij `wacht_op_reactie` wordt er nooit geclaimd, dus `toegewezen_aan` blijft NULL en de bewerkknoppen blijven uit.

Dezelfde situatie ontstaat structureel telkens wanneer een project teruggegooid wordt naar de pool ná deel 1 (bv. door de auto-release uit `useBatchVersturen` of door handmatige "terug naar pool" vanuit de inbox tijdens deel 2).

## Plan

### 1. Directe data-fix voor dit project
SQL:
```
UPDATE public.projects
SET toegewezen_aan = <eerste niet-Julian auditor user_id>,
    toegewezen_op = now(),
    toewijzing = 'specifiek'
WHERE id = '66068f45-f5a6-48a0-acb9-d4409737f9c0';
```
Plus een notificatie naar die auditor. Ik kies hierbij een actieve auditor uit `user_roles` die niet Julian (de EP-adviseur) is — ik leg de gekozen persoon vast in het migratie-bericht zodat je het kunt controleren vóór akkoord.

Alternatief: in plaats van automatisch een specifieke auditor te kiezen, kunnen we het project in de pool laten en alleen de structurele fix (stap 2) doorvoeren — dan kan de eerste auditor die het opent het direct claimen. Geef aan welke variant je wilt.

### 2. Structurele fix in `src/pages/ProjectDetail.tsx`
`autoSetStatus` uitbreiden zodat ook bij `status = 'wacht_op_reactie'` (én eventueel `deel2_bezig`) een poolproject automatisch geclaimd wordt door de openende auditor — met dezelfde EP-adviseur-blokkade die nu al bestaat. De status zelf wordt niet gewijzigd; alleen `toegewezen_aan`/`toegewezen_op`/`toewijzing` via `claim_project`.

Resultaat: zodra een willekeurige auditor het pool-project opent, krijgt hij/zij het toegewezen en kan de beoordeling van de reactie uitvoeren. Julian wordt geblokkeerd met de bestaande toast.

### 3. Buiten scope
- Geen wijzigingen aan `claim_project` zelf (de EP-adviseur-check zit er al in).
- Geen wijziging aan inbox-weergave of e-mails.
- Geen wijziging aan deel 1-flow.

## Technisch

- **Bestand**: `src/pages/ProjectDetail.tsx` — derde tak toevoegen in `autoSetStatus`:
  ```ts
  else if (hasRole("auditor") && currentStatus === "wacht_op_reactie") {
    const { data: proj } = await supabase.from("projects")
      .select("toewijzing, toegewezen_aan").eq("id", id!).single();
    if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
      if (isAdviseurVanProject) { /* toast + navigate */ return; }
      const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
      if (!claimed) { /* toast + navigate */ return; }
      loadProject();
    }
  }
  ```
- **Data-fix**: één migratie met een `UPDATE projects ...` en een `INSERT INTO notificaties ...`. Auditor wordt geselecteerd door mij vóór de migratie (ik laat de gekozen user_id zien in de beschrijving).
