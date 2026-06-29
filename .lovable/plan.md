# Plan: Functiescheiding EP-adviseur per project

## Probleem
Een gebruiker met meerdere rollen (bv. Julian = beheer + auditor + ep_adviseur) kan op een project waar hij zelf EP-adviseur is óók als auditor zijn eigen reactie goedkeuren. De huidige `hasRole(...)`-checks zijn globaal en kijken niet naar de rol die deze persoon *op dit specifieke project* heeft.

## Uitgangspunt
- **Beheer + Auditor blijven samen** — die rollen gedragen zich zoals nu.
- **Alleen EP-adviseur wordt strikt gescheiden**: ben je de adviseur van een project, dan kun je op datzelfde project geen auditor-/beoordelingsacties uitvoeren, ook al heb je globaal die rollen.

Per project bepalen we dus:
- `isAdviseurVanProject` = `projects.adviseur_id` → `adviseurs.user_id === auth.uid()`.
- `magAuditorActiesDoen` = (`hasRole("auditor")` of `hasRole("beheer")`) **én niet** `isAdviseurVanProject`.
- `magAdviseurActiesDoen` = `isAdviseurVanProject` (of, voor projecten waar geen adviseur gekoppeld is, de bestaande logica).

Beheer/auditor op andere projecten verandert niets.

## Wijzigingen

### 1. Centrale helper
Nieuw: `src/hooks/useProjectRole.ts`
- Input: `project` (of `project_id`).
- Output: `{ isAdviseurVanProject, magAuditorActiesDoen, magAdviseurActiesDoen }`.
- Eén query bij projectlaad: koppel `auth.uid()` aan `projects.adviseur_id` via `adviseurs.user_id`.

### 2. UI-aanpassingen
Overal waar nu `hasRole("auditor") || hasRole("beheer")` of `hasRole("ep_adviseur")` direct beslist over reactie-/beoordelingsacties, gaan we via de helper:

- `src/components/projecten/BatchVersturen.tsx` en `BatchVersturenCompact.tsx`
  - Auditor-paneel verschijnt niet als `isAdviseurVanProject` waar is.
  - EP-adviseur-paneel alleen als `magAdviseurActiesDoen`.
- `src/pages/FindingBeoordeling.tsx`
  - Beoordelings-UI (akkoord / niet akkoord / tekenaar toewijzen) verborgen + melding *"Je bent EP-adviseur van dit project en kunt je eigen reactie niet beoordelen"* als `isAdviseurVanProject`.
- `src/pages/FindingReactie.tsx`
  - Reactieformulier alleen als `magAdviseurActiesDoen`.
- `src/pages/ProjectDetail.tsx`
  - Statusknoppen ("Deel 1 afronden", "Deel 2 afronden", afronden audit) verborgen als `isAdviseurVanProject` (ook al heb je auditor/beheer).
  - Header toont een badge: **"Jouw rol op dit project: EP-adviseur"** wanneer dat geldt, anders blijft alles zoals het is.
- `src/pages/Inbox.tsx` en `FaseTabel.tsx`
  - Een project waar je adviseur bent verschijnt niet in jouw auditor-takenlijst, en andersom.

Beheerschermen (`/beheer`, `/checklist-beheer`) en algemene auditor-overzichten blijven ongewijzigd.

### 3. Backend-guard (database-trigger)
UI alleen is niet genoeg — via de API kan een gebruiker met de juiste globale rollen alsnog updaten. We voegen één trigger toe op `findings`:

- `BEFORE UPDATE`: als `NEW.status` overgaat naar `reactie_goedgekeurd` of `gesloten` én `auth.uid()` is de adviseur van dit project → exception.
- Analoge `BEFORE INSERT` op `messages` voor berichten met `[Goedgekeurd]`- of `[Niet akkoord`-prefix vanuit de projectadviseur.

Beheer-/auditor-acties op andere projecten worden niet beperkt.

## Technische details

```ts
// useProjectRole.ts (essentie)
const { data } = await supabase
  .from("projects")
  .select("adviseur_id, adviseurs:adviseur_id(user_id)")
  .eq("id", projectId).maybeSingle();
const isAdviseurVanProject = data?.adviseurs?.user_id === user.id;
const magAuditorActiesDoen =
  (hasRole("auditor") || hasRole("beheer")) && !isAdviseurVanProject;
const magAdviseurActiesDoen = isAdviseurVanProject;
```

```sql
create or replace function public.guard_finding_review()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_adviseur_user uuid;
begin
  if NEW.status in ('reactie_goedgekeurd','gesloten')
     and NEW.status is distinct from OLD.status then
    select a.user_id into v_adviseur_user
    from public.projects p
    join public.adviseurs a on a.id = p.adviseur_id
    where p.id = NEW.project_id;
    if v_adviseur_user is not null and v_adviseur_user = auth.uid() then
      raise exception 'Functiescheiding: EP-adviseur van dit project mag eigen reactie niet beoordelen';
    end if;
  end if;
  return NEW;
end$$;

create trigger trg_guard_finding_review
before update on public.findings
for each row execute function public.guard_finding_review();
```

## Buiten scope
- Geen UI om "tijdelijk van rol te wisselen" — de scheiding volgt strikt uit het adviseurschap op het project.
- Bestaande projecten waar Julian zowel adviseur als auditor was: na deze wijziging moet een andere auditor de beoordeling doen, eventueel via Beheer her-toe te wijzen.

## Verificatie
- Login als Julian, open een project waarvan hij EP-adviseur is → geen beoordelingsknoppen, geen auditor batch-paneel, badge "EP-adviseur".
- Open een project waarvan iemand anders adviseur is → Julian kan gewoon als auditor/beheerder werken.
- Via API een finding op `reactie_goedgekeurd` zetten op een eigen-adviseur-project → trigger blokkeert.
