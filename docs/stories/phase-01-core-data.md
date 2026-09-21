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

Migration deployment succeeds against the linked non-production Supabase Cloud
project; positive and negative linked-project RLS tests pass; domain validator
tests pass; generated Cloud database types and source types agree. Phase 02 may
begin only after these checks are repeatable without a local Supabase stack.

## Exit evidence — 2026-09-21

- Linked Cloud migration `20260921084337_phase_01_core_data` is applied.
- The `core_schema` pgTAP suite passed all 8 assertions against Cloud.
- The `rls` pgTAP suite passed all 6 assertions against Cloud, including
  cross-recruiter denial and anonymous reads of persisted private Storage
  objects. Both suites executed in transactions and rolled back their fixtures.
- `src/lib/supabase/database.types.ts` was generated from the linked Cloud
  public schema; source Job and Application lifecycle types reference those
  generated enums.
- Security advisors returned no findings. Performance advisors report only two
  informational unused-index notices on this otherwise empty project.
- Re-run the Cloud CLI proof with `npm run db:test`; this contacts the linked
  Cloud database and uses Docker only for the `pg_prove` client, not a local
  Supabase stack. The same SQL suites were verified through the Supabase MCP
  transaction runner in this completion check.
