# Jev Match MVP

## Outcome

Deliver a production-capable Jev Match MVP through the ordered packets in
`docs/stories/`: recruiters create and publish evaluation plans, candidates
submit resumes, Jev evaluates the resume, and deterministic TypeScript scoring
produces the final Match Score.

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

- Accepted source baseline: `SPEC.md`.
- Living product behavior and externally observable policy: `docs/product/`.
- Phase scope, acceptance criteria, and proof: `docs/stories/`.
- Repository workflow and quality gates: `AGENTS.md` and `docs/WORKFLOW.md`.
- Product name: Jev Match.
- AI plan drafting: official `openai` package with optional server-only base URL.
- Resume evaluation: `@typesafe-ai/sdk`, `jev-latest`, and server-only credentials.
- Final score: deterministic TypeScript logic; criterion importance is not sent
  to Jev.
- Visual direction: `DESIGN.md` and `docs/design/concepts/`. The existing UI is a
  preserved prototype to reuse, not evidence that its later product phase is
  complete.

## Delivery phases

The packet index in `docs/stories/README.md` owns phase order and exit gates.

1. [in progress] Phase 01 — core types, schema, private Storage, and RLS.
2. [pending] Phase 02 — Supabase recruiter authentication.
3. [pending] Phase 03 — draft Job and JD processing.
4. [pending] Phase 04 — OpenAI Evaluation Plan draft generation.
5. [pending] Phase 05 — Evaluation Editor.
6. [pending] Phase 06 — publish, immutable plan, public slug, and close.
7. [pending] Phase 07 — public candidate application and CV processing.
8. [pending] Phase 08 — TypeSafe/Jev evaluation.
9. [pending] Phase 09 — deterministic normalization and scoring.
10. [pending] Phase 10 — data-backed recruiter dashboard and candidate review.

Cross-phase visual work is complete as a prototype and preserved for reuse. It
does not advance a packet's status without that packet's behavior-level proof.

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
- 2026-09-21: Froze feature implementation, derived living product documents from
  `SPEC.md`, added ten dependency-ordered story packets, recorded unresolved
  decision gates, and preserved the current UI as the Phase 10 visual prototype.
