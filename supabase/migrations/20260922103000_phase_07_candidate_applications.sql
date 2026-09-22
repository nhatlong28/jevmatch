create unique index applications_job_candidate_email_unique_idx
on public.applications (job_id, lower(candidate_email));

create table public.application_submission_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index application_submission_attempts_ip_created_at_idx
on public.application_submission_attempts (ip_hash, created_at);

alter table public.application_submission_attempts enable row level security;

revoke all on table public.application_submission_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.application_submission_attempts to service_role;

create or replace function public.record_public_application_submission(
  submitted_slug text,
  submitted_candidate_name text,
  submitted_candidate_email text,
  submitted_resume_file_path text,
  submitted_resume_text text,
  submitting_ip text
)
returns table (application_id uuid, result text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_job_id uuid;
  normalized_ip_hash text;
  inserted_application_id uuid;
begin
  select jobs.id into published_job_id
  from public.jobs
  where jobs.public_slug = submitted_slug
    and jobs.status = 'published';

  if published_job_id is null then
    return query select null::uuid, 'job_not_accepting'::text;
    return;
  end if;

  normalized_ip_hash := encode(extensions.digest(submitting_ip, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtext(normalized_ip_hash));
  delete from public.application_submission_attempts
  where ip_hash = normalized_ip_hash
    and created_at < now() - interval '1 hour';

  if (select count(*) from public.application_submission_attempts where ip_hash = normalized_ip_hash) >= 3 then
    return query select null::uuid, 'rate_limited'::text;
    return;
  end if;

  if exists (
    select 1
    from public.applications
    where job_id = published_job_id
      and lower(candidate_email) = lower(submitted_candidate_email)
  ) then
    return query select null::uuid, 'duplicate_email'::text;
    return;
  end if;

  insert into public.applications (
    job_id,
    candidate_name,
    candidate_email,
    resume_file_path,
    resume_text,
    status
  ) values (
    published_job_id,
    submitted_candidate_name,
    lower(submitted_candidate_email),
    submitted_resume_file_path,
    submitted_resume_text,
    'processing'
  ) returning id into inserted_application_id;

  insert into public.application_submission_attempts (ip_hash)
  values (normalized_ip_hash);

  return query select inserted_application_id, 'submitted'::text;
exception when unique_violation then
  return query select null::uuid, 'duplicate_email'::text;
end;
$$;

revoke all on function public.record_public_application_submission(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_public_application_submission(text, text, text, text, text, text) to service_role;
