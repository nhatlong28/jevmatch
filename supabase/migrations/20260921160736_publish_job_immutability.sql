create or replace function public.evaluation_plan_is_valid(plan jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(plan) = 'object'
    and jsonb_typeof(plan -> 'questions') = 'array'
    and jsonb_array_length(plan -> 'questions') > 0
    and not exists (
      select 1
      from jsonb_array_elements(plan -> 'questions') as question
      where jsonb_typeof(question) <> 'object'
        or coalesce(question ->> 'id', '') = ''
        or question ->> 'importance' not in ('required', 'core', 'preferred')
        or jsonb_typeof(question -> 'jev') <> 'object'
        or question -> 'jev' ->> 'type' not in ('noul', 'score')
        or coalesce(question -> 'jev' ->> 'instructions', '') = ''
        or (
          question -> 'jev' ->> 'type' = 'score'
          and (
            jsonb_typeof(question -> 'jev' -> 'criteria') <> 'array'
            or jsonb_array_length(question -> 'jev' -> 'criteria') < 2
            or exists (
              select 1 from jsonb_array_elements_text(question -> 'jev' -> 'criteria') criterion
              where btrim(criterion) = ''
            )
          )
        )
        or (question -> 'jev' ->> 'type' = 'noul' and question -> 'jev' ? 'criteria')
    )
    and (
      select count(*) = count(distinct question ->> 'id')
      from jsonb_array_elements(plan -> 'questions') as question
    );
$$;

create or replace function public.enforce_job_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (
    new.public_slug is null or not public.evaluation_plan_is_valid(new.evaluation_plan)
  ) then
    raise exception 'published jobs require a valid Evaluation Plan and public slug';
  end if;

  if tg_op = 'UPDATE' then
    if old.status <> 'draft' and new.evaluation_plan is distinct from old.evaluation_plan then
      raise exception 'published or closed Evaluation Plans are immutable';
    end if;
    if old.status = 'published' and new.status not in ('published', 'closed') then
      raise exception 'published Jobs may only remain published or close';
    end if;
    if old.status = 'closed' and new.status <> 'closed' then
      raise exception 'closed Jobs cannot change state';
    end if;
  end if;
  return new;
end;
$$;

create trigger jobs_enforce_lifecycle
before insert or update on public.jobs
for each row execute function public.enforce_job_lifecycle();

revoke execute on function public.evaluation_plan_is_valid(jsonb) from public, anon, authenticated;
revoke execute on function public.enforce_job_lifecycle() from public, anon, authenticated;
