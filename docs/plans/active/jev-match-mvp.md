# Jev Match MVP

## Outcome

Deliver a production-capable Jev Match MVP that implements the product flows and
constraints in `SPEC.md`: HR users create and publish evaluation plans, candidates
submit resumes, Jev evaluates the evidence, and deterministic TypeScript scoring
produces the final match score.

## Scope

### In scope

- A cohesive responsive design system and the complete MVP screen set.
- Next.js App Router application with TypeScript, Tailwind CSS, and shadcn/ui.
- Supabase authentication, Postgres schema, Storage, and row-level security.
- Server-only LLM integration through the official `openai` package, including an
  optional `LLM_BASE_URL`.
- TypeSafe SDK integration with Jev using `{ resume: resumeText }` state.
- Deterministic normalization, importance weighting, aggregation, and tests.
- HR job, evaluation-plan, publishing, application ranking, and candidate-detail
  flows.
- Public candidate application and resume upload flow.
- Validation covering core logic, authorization boundaries, builds, and rendered
  browser behavior.

### Out of scope

- Automated hiring or rejection decisions.
- Candidate access to match scores or internal evaluation details.
- Choice-type evaluation criteria.
- Additional ATS, payroll, calendar, or email integrations.
- Product behavior not authorized by `SPEC.md`.

## Authority and decisions

- Product behavior and externally observable policy: `SPEC.md`.
- Repository workflow and quality gates: `AGENTS.md` and `docs/WORKFLOW.md`.
- Product name: Jev Match.
- AI plan drafting: official `openai` package with optional server-only base URL.
- Resume evaluation: `@typesafe-ai/sdk`, `jev-latest`, and server-only credentials.
- Final score: deterministic TypeScript logic; criterion importance is not sent
  to Jev.
- Visual direction will be recorded as repository design guidance after concept
  generation and before implementation.

## Milestones

1. [complete] Generate and inspect a coherent visual concept for every primary
   MVP surface; extract the accepted design language into repository guidance.
2. [in progress] Scaffold the Next.js application, shared layout, tokens, and reusable
   shadcn/ui primitives.
3. [pending] Implement domain types, validation, score normalization, weighted
   aggregation, and unit tests.
4. [pending] Add the Supabase schema, Storage policies, RLS policies, and policy
   validation.
5. [pending] Implement authentication, job creation, JD ingestion, and editable
   AI-drafted evaluation plans.
6. [pending] Implement plan publishing and immutable published-plan behavior.
7. [pending] Implement public applications, resume extraction, Jev evaluation,
   and deterministic scoring.
8. [pending] Implement the HR application ranking and candidate-detail views with
   signed resume access.
9. [pending] Run static, unit, integration, security-boundary, build, and rendered
   browser validation; resolve all material findings.

## Validation

- Repository formatting and static checks pass.
- Domain tests prove score normalization and importance weighting, including
  boundary and invalid-input cases.
- Database tests prove role, ownership, public-submission, and published-plan
  boundaries.
- Server integration tests prove secrets never cross into client bundles and the
  optional OpenAI base URL is applied only when configured.
- A production build succeeds.
- Browser verification covers the full desktop flow and responsive candidate
  application flow, with screenshots compared against the visual concept.

Current foundation commands:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`

Rendered smoke testing uses Playwright against `http://127.0.0.1:3000` until the
Browser plugin is available.

## Risks and recovery

- AI providers can return malformed or partial data. Validate all provider output
  before persistence and keep deterministic scoring independent of model output.
- Resume extraction quality varies by file type. Preserve the original upload,
  expose a clear failure state, and avoid scoring when extraction is unusable.
- Public submissions create an abuse surface. Keep public writes narrowly scoped,
  validate uploads and payload sizes, and ensure internal reads remain protected.
- Published evaluation plans are decision records. Enforce immutability in both
  application behavior and database policy.
- Provider credentials and resume data are sensitive. Keep all provider calls and
  signed URL generation on the server and validate access controls directly.

Recovery is incremental: each milestone should remain a coherent commit-sized
change, and unfinished work stays documented here until its validation passes.

## Progress log

- 2026-09-21: Confirmed the repository is a clean skeleton, reviewed product and
  workflow authority, and began visual concept work before application scaffolding.
- 2026-09-21: Completed five visual references and `DESIGN.md`; scaffolded Next.js
  16.3, React 19.3, Tailwind CSS 4.3, and shadcn/ui; implemented and browser-tested
  the responsive Jobs dashboard foundation.
