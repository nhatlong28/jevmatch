# Phase 01 — Core Types and Data

## Outcome

Establish the typed domain and private Supabase persistence boundaries on which
all later phases depend.

## Authority

- `docs/product/evaluation-plans.md`
- `docs/product/data-and-security.md`
- `docs/product/access-and-lifecycle.md`

## Scope

- TypeScript types for Job, Evaluation Plan/question, Application, and evaluation
  result.
- Manual runtime validation for Evaluation Plans; no Zod.
- Supabase migrations for `jobs` and `applications`, lifecycle constraints,
  foreign keys, timestamps, and unique public slug.
- Private `job-descriptions` and `resumes` buckets.
- RLS foundations for recruiter ownership and application reads through Job.

## Acceptance criteria

- Invalid type, importance, empty instructions, duplicate ID, and Score with fewer
  than two non-empty criteria are rejected by focused tests.
- Database constraints reject invalid lifecycle values and broken ownership
  references.
- Authenticated test user A cannot read user B's Job or applications.
- Anonymous users cannot read either table or either Storage bucket.
- Service-role secrets are referenced only from server-only modules/configuration.

## Out of scope

UI, recruiter login flow, file extraction, provider calls, and scoring logic.

## Proof and exit gate

Migration reset succeeds; positive and negative RLS tests pass; domain validator
tests pass; generated database types and source types agree. Phase 02 may begin
only after these checks are repeatable locally.
