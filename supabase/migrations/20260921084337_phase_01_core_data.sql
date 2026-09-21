create extension if not exists pgcrypto with schema extensions;

create type public.job_status as enum ('draft', 'published', 'closed');
create type public.application_status as enum ('processing', 'evaluated', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  recruiter_id uuid not null references auth.users (id) on delete restrict,
  title text,
  jd_file_path text,
  jd_text text,
  evaluation_plan jsonb,
  public_slug text unique,
  status public.job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_evaluation_plan_object_check check (
    evaluation_plan is null or jsonb_typeof(evaluation_plan) = 'object'
  )
);

create index jobs_recruiter_id_idx on public.jobs (recruiter_id);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create table public.applications (
  id uuid primary key default extensions.gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  candidate_name text not null,
  candidate_email text not null,
  resume_file_path text not null,
  resume_text text,
  match_score numeric,
  evaluations jsonb,
  status public.application_status not null default 'processing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_evaluations_array_check check (
    evaluations is null or jsonb_typeof(evaluations) = 'array'
  )
);

create index applications_job_id_idx on public.applications (job_id);

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.applications enable row level security;

create policy "Recruiters can read own jobs"
on public.jobs
for select
to authenticated
using (recruiter_id = (select auth.uid()));

create policy "Recruiters can create own jobs"
on public.jobs
for insert
to authenticated
with check (recruiter_id = (select auth.uid()));

create policy "Recruiters can update own jobs"
on public.jobs
for update
to authenticated
using (recruiter_id = (select auth.uid()))
with check (recruiter_id = (select auth.uid()));

create policy "Recruiters can read applications of own jobs"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs
    where jobs.id = applications.job_id
      and jobs.recruiter_id = (select auth.uid())
  )
);

revoke all on table public.jobs from anon, authenticated;
revoke all on table public.applications from anon, authenticated;

grant select, insert, update on table public.jobs to authenticated;
grant select on table public.applications to authenticated;
grant select, insert, update, delete on table public.jobs to service_role;
grant select, insert, update, delete on table public.applications to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values
  ('job-descriptions', 'job-descriptions', false),
  ('resumes', 'resumes', false)
on conflict (id) do update set public = excluded.public;

