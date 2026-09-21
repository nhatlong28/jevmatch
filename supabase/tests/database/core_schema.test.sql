begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000001', 'owner-a@example.com');

select has_table('public', 'jobs', 'jobs table exists');
select has_table('public', 'applications', 'applications table exists');

select throws_ok(
  $$
    insert into public.jobs (recruiter_id, status)
    values ('10000000-0000-0000-0000-000000000001', 'archived')
  $$,
  '22P02',
  null,
  'jobs reject invalid lifecycle values'
);

select throws_ok(
  $$
    insert into public.jobs (recruiter_id)
    values ('90000000-0000-0000-0000-000000000009')
  $$,
  '23503',
  null,
  'jobs reject broken recruiter ownership references'
);

insert into public.jobs (id, recruiter_id)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
);

select throws_ok(
  $$
    insert into public.applications (
      job_id,
      candidate_name,
      candidate_email,
      resume_file_path,
      status
    ) values (
      '20000000-0000-0000-0000-000000000001',
      'Candidate',
      'candidate@example.com',
      '20000000-0000-0000-0000-000000000001/resume.pdf',
      'queued'
    )
  $$,
  '22P02',
  null,
  'applications reject invalid processing values'
);

select throws_ok(
  $$
    insert into public.applications (
      job_id,
      candidate_name,
      candidate_email,
      resume_file_path
    ) values (
      '90000000-0000-0000-0000-000000000009',
      'Candidate',
      'candidate@example.com',
      'missing-job/resume.pdf'
    )
  $$,
  '23503',
  null,
  'applications reject broken job references'
);

select results_eq(
  $$ select public from storage.buckets where id = 'job-descriptions' $$,
  array[false],
  'job descriptions bucket is private'
);

select results_eq(
  $$ select public from storage.buckets where id = 'resumes' $$,
  array[false],
  'resumes bucket is private'
);

select * from finish();
rollback;
