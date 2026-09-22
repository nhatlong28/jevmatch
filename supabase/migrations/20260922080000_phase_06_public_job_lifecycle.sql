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
        or btrim(coalesce(question ->> 'id', '')) = ''
        or question ->> 'importance' not in ('required', 'core', 'preferred')
        or jsonb_typeof(question -> 'jev') <> 'object'
        or question -> 'jev' ->> 'type' not in ('noul', 'score')
        or btrim(coalesce(question -> 'jev' ->> 'instructions', '')) = ''
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
    btrim(coalesce(new.public_slug, '')) = ''
    or not public.evaluation_plan_is_valid(new.evaluation_plan)
  ) then
    raise exception 'published jobs require a valid Evaluation Plan and public slug';
  end if;

  if tg_op = 'UPDATE' then
    if old.status <> 'draft' and new.evaluation_plan is distinct from old.evaluation_plan then
      raise exception 'published or closed Evaluation Plans are immutable';
    end if;
    if old.status <> 'draft' and new.public_slug is distinct from old.public_slug then
      raise exception 'published or closed public slugs are immutable';
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

create or replace function public.published_job_for_slug(requested_slug text)
returns table (id uuid, title text, public_slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select jobs.id, jobs.title, jobs.public_slug
  from public.jobs
  where jobs.public_slug = requested_slug
    and jobs.status = 'published';
$$;

revoke all on function public.published_job_for_slug(text) from public, anon, authenticated;
grant execute on function public.published_job_for_slug(text) to anon, authenticated;
