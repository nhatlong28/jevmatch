alter table public.jobs
  add column location text;

alter table public.applications
  add column first_viewed_at timestamptz,
  add column reviewed_at timestamptz,
  add constraint applications_review_timestamps_check check (
    reviewed_at is null or first_viewed_at is not null
  );

drop function public.published_job_for_slug(text);

create function public.published_job_for_slug(requested_slug text)
returns table (id uuid, title text, location text, public_slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select jobs.id, jobs.title, jobs.location, jobs.public_slug
  from public.jobs
  where jobs.public_slug = requested_slug
    and jobs.status = 'published';
$$;

revoke all on function public.published_job_for_slug(text) from public, anon, authenticated;
grant execute on function public.published_job_for_slug(text) to anon, authenticated;
