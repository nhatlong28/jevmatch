begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.com'),
  ('10000000-0000-0000-0000-000000000002', 'owner-b@example.com');

insert into public.jobs (id, recruiter_id, title)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Owner A job'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Owner B job'
  );

insert into public.applications (
  id,
  job_id,
  candidate_name,
  candidate_email,
  resume_file_path
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Candidate A',
    'candidate-a@example.com',
    '20000000-0000-0000-0000-000000000001/resume.pdf'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Candidate B',
    'candidate-b@example.com',
    '20000000-0000-0000-0000-000000000002/resume.pdf'
  );

insert into storage.objects (bucket_id, name)
values
  ('job-descriptions', '20000000-0000-0000-0000-000000000001/source.pdf'),
  ('resumes', '30000000-0000-0000-0000-000000000001/resume.pdf');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$ select id from public.jobs order by id $$,
  array['20000000-0000-0000-0000-000000000001'::uuid],
  'recruiter A reads only their own jobs'
);

select results_eq(
  $$ select id from public.applications order by id $$,
  array['30000000-0000-0000-0000-000000000001'::uuid],
  'recruiter A reads only applications through their own jobs'
);

select results_eq(
  $$
    update public.jobs
    set evaluation_plan = '{"questions":[{"id":"experience","importance":"core","jev":{"type":"noul","instructions":"Is relevant experience shown?"}}]}'::jsonb
    where id = '20000000-0000-0000-0000-000000000001'
    returning id
  $$,
  array['20000000-0000-0000-0000-000000000001'::uuid],
  'recruiter A can update their own draft Evaluation Plan'
);

select is_empty(
  $$
    update public.jobs
    set evaluation_plan = '{"questions":[{"id":"tampered","importance":"core","jev":{"type":"noul","instructions":"Should not be saved"}}]}'::jsonb
    where id = '20000000-0000-0000-0000-000000000002'
    returning id
  $$,
  'recruiter A cannot update recruiter B draft Evaluation Plan'
);

select ok(
  public.evaluation_plan_is_valid(
    '{"questions":[{"id":"experience","importance":"core","jev":{"type":"noul","instructions":"Is relevant experience shown?"}}]}'::jsonb
  ),
  'authenticated recruiter can execute Evaluation Plan validation during a Job write'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('job-descriptions', '10000000-0000-0000-0000-000000000001/new-source.pdf')
  $$,
  'recruiter A can upload a job description in their own folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('job-descriptions', '10000000-0000-0000-0000-000000000002/other-source.pdf')
  $$,
  '42501',
  null,
  'recruiter A cannot upload a job description into recruiter B folder'
);

select throws_ok(
  $$
    insert into public.jobs (recruiter_id, title)
    values ('10000000-0000-0000-0000-000000000002', 'Impersonated job')
  $$,
  '42501',
  null,
  'recruiter A cannot create a job for recruiter B'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select id from public.jobs $$,
  '42501',
  null,
  'anonymous users have no grant to read jobs'
);

select throws_ok(
  $$ select id from public.applications $$,
  '42501',
  null,
  'anonymous users have no grant to read applications'
);

select throws_ok(
  $$ select public.evaluation_plan_is_valid('{"questions":[]}'::jsonb) $$,
  '42501',
  null,
  'anonymous users cannot execute internal Evaluation Plan validation'
);

select is_empty(
  $$
    select name
    from storage.objects
    where bucket_id in ('job-descriptions', 'resumes')
  $$,
  'anonymous users cannot read private storage objects that exist'
);

select * from finish();
rollback;
