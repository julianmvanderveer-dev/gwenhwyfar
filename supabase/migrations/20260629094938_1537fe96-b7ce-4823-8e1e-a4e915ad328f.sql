
-- Guard: voorkomt dat de EP-adviseur van een project zijn eigen bevinding-beoordeling (goedkeuren/afsluiten) doet
create or replace function public.guard_finding_review_separation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adviseur_user uuid;
begin
  if NEW.status in ('reactie_goedgekeurd','gesloten')
     and NEW.status is distinct from OLD.status then
    select a.user_id
      into v_adviseur_user
      from public.projects p
      join public.adviseurs a on a.id = p.adviseur_id
     where p.id = NEW.project_id;

    if v_adviseur_user is not null
       and auth.uid() is not null
       and v_adviseur_user = auth.uid() then
      raise exception 'Functiescheiding: EP-adviseur van dit project mag zijn eigen reactie niet beoordelen of afsluiten.'
        using errcode = 'check_violation';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_finding_review_separation on public.findings;
create trigger trg_guard_finding_review_separation
before update on public.findings
for each row execute function public.guard_finding_review_separation();

-- Guard: voorkomt dat de EP-adviseur van een project goedkeurings-/afkeuringsberichten
-- als auditor namens zichzelf plaatst.
create or replace function public.guard_message_review_separation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adviseur_user uuid;
  v_project_id uuid;
begin
  if NEW.bericht is null then return NEW; end if;
  if not (NEW.bericht like '[Goedgekeurd]%' or NEW.bericht like '[Niet akkoord%') then
    return NEW;
  end if;

  select f.project_id into v_project_id
    from public.findings f
   where f.id = NEW.finding_id;
  if v_project_id is null then return NEW; end if;

  select a.user_id into v_adviseur_user
    from public.projects p
    join public.adviseurs a on a.id = p.adviseur_id
   where p.id = v_project_id;

  if v_adviseur_user is not null
     and auth.uid() is not null
     and v_adviseur_user = auth.uid() then
    raise exception 'Functiescheiding: EP-adviseur van dit project mag geen beoordelingsbericht plaatsen.'
      using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_guard_message_review_separation on public.messages;
create trigger trg_guard_message_review_separation
before insert on public.messages
for each row execute function public.guard_message_review_separation();
