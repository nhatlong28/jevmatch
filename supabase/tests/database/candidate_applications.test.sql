begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000007', 'phase-seven-owner@example.com');

insert into public.jobs (id, recruiter_id, title, public_slug, status, evaluation_plan)
values (
  '20000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000007',
  'Candidate role',
  'candidate-role',
  'published',
  '{"questions":[{"id":"experience","importance":"core","jev":{"type":"noul","instructions":"Is relevant experience shown?"}}]}'::jsonb
);

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate One', 'one@example.com', 'one.pdf', 'Resume one', '203.0.113.7'
    )
  $$,
  array['submitted'],
  'a published Job accepts a valid public application'
);

select results_eq(
  $$ select status::text from public.applications where candidate_email = 'one@example.com' $$,
  array['processing'],
  'a public application begins in processing without scores or evaluations'
);

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate One Again', 'ONE@example.com', 'repeat.pdf', 'Repeat', '203.0.113.8'
    )
  $$,
  array['duplicate_email'],
  'the same email cannot apply twice to one Job'
);

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate Two', 'two@example.com', 'two.pdf', 'Resume two', '203.0.113.7'
    )
  $$,
  array['submitted'],
  'a source IP may submit a second application within the hour'
);

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate Three', 'three@example.com', 'three.pdf', 'Resume three', '203.0.113.7'
    )
  $$,
  array['submitted'],
  'a source IP may submit a third application within the hour'
);

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate Four', 'four@example.com', 'four.pdf', 'Resume four', '203.0.113.7'
    )
  $$,
  array['rate_limited'],
  'a fourth application from one source IP is rate limited'
);

update public.jobs
set status = 'closed'
where id = '20000000-0000-0000-0000-000000000007';

select results_eq(
  $$
    select result
    from public.record_public_application_submission(
      'candidate-role', 'Candidate Five', 'five@example.com', 'five.pdf', 'Resume five', '203.0.113.9'
    )
  $$,
  array['job_not_accepting'],
  'closed Jobs reject new public applications'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select * from public.record_public_application_submission('candidate-role', 'Candidate', 'candidate@example.com', 'resume.pdf', 'Resume', '203.0.113.10') $$,
  '42501',
  null,
  'anonymous callers cannot bypass the server submission boundary'
);

select throws_ok(
  $$ select * from public.application_submission_attempts $$,
  '42501',
  null,
  'anonymous callers cannot read rate-limit records'
);

select throws_ok(
  $$ select * from public.applications $$,
  '42501',
  null,
  'anonymous callers cannot read submitted applications'
);

select * from finish();
rollback;
