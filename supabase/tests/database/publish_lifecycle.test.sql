begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000006', 'phase-six-owner@example.com');

insert into public.jobs (id, recruiter_id, title, evaluation_plan)
values (
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000006',
  'Published role',
  '{"questions":[{"id":"experience","importance":"core","jev":{"type":"noul","instructions":"Is relevant experience shown?"}}]}'::jsonb
);

select throws_ok(
  $$
    update public.jobs
    set status = 'published', public_slug = 'invalid-plan',
      evaluation_plan = '{"questions":[{"id":"experience","importance":"core","jev":{"type":"noul","instructions":"   "}}]}'::jsonb
    where id = '20000000-0000-0000-0000-000000000006'
  $$,
  'P0001',
  'published jobs require a valid Evaluation Plan and public slug',
  'whitespace-only published instructions are rejected by database validation'
);

update public.jobs
set public_slug = 'published-role', status = 'published'
where id = '20000000-0000-0000-0000-000000000006';

select results_eq(
  $$ select status::text from public.jobs where id = '20000000-0000-0000-0000-000000000006' $$,
  array['published'],
  'a valid plan publishes atomically'
);

select throws_ok(
  $$
    update public.jobs
    set evaluation_plan = '{"questions":[{"id":"changed","importance":"core","jev":{"type":"noul","instructions":"Changed"}}]}'::jsonb
    where id = '20000000-0000-0000-0000-000000000006'
  $$,
  'P0001',
  'published or closed Evaluation Plans are immutable',
  'a published plan cannot be altered directly'
);

select throws_ok(
  $$
    update public.jobs
    set public_slug = 'different-role'
    where id = '20000000-0000-0000-0000-000000000006'
  $$,
  'P0001',
  'published or closed public slugs are immutable',
  'a published public slug cannot be altered directly'
);

select results_eq(
  $$ select title from public.published_job_for_slug('published-role') $$,
  array['Published role'],
  'the public resolver exposes a published Job title'
);

update public.jobs
set status = 'closed'
where id = '20000000-0000-0000-0000-000000000006';

select is_empty(
  $$ select * from public.published_job_for_slug('published-role') $$,
  'closed Jobs no longer resolve through the public slug'
);

select throws_ok(
  $$
    update public.jobs
    set status = 'published'
    where id = '20000000-0000-0000-0000-000000000006'
  $$,
  'P0001',
  'closed Jobs cannot change state',
  'closed Jobs cannot reopen'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select results_eq(
  $$ select title from public.published_job_for_slug('not-a-job') $$,
  array[]::text[],
  'anonymous callers can use only the narrowly scoped public resolver'
);

select throws_ok(
  $$ select id from public.jobs $$,
  '42501',
  null,
  'anonymous callers still cannot read jobs directly'
);

select * from finish();
rollback;
