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
- Recruiter accounts are provisioned by an administrator in Supabase Auth; the
  MVP does not expose self-service signup.

## Delivery phases

The packet index in `docs/stories/README.md` owns phase order and exit gates.

1. [complete] Phase 01 — core types, schema, private Storage, and RLS.
2. [complete] Phase 02 — Supabase recruiter authentication.
3. [complete] Phase 03 — draft Job and JD processing.
4. [complete] Phase 04 — OpenAI Evaluation Plan draft generation.
5. [complete] Phase 05 — Evaluation Editor.
6. [complete] Phase 06 — publish, immutable plan, public slug, and close.
7. [complete] Phase 07 — public candidate application and CV processing.
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
- 2026-09-21: Began Phase 01 domain types, manual Evaluation Plan validation,
  Cloud-ready migrations, private buckets, RLS policies, and pgTAP proof. The
  product owner selected Supabase Cloud only, so local Docker lifecycle commands
  and port configuration were removed. Cloud deployment, linked RLS tests, and
  Cloud-generated type agreement remain before Phase 01 can complete.
- 2026-09-21: The product owner identified the Supabase Cloud project as
  `jev-match`. Repository tests, typecheck, lint, and production build pass, but
  this task has Supabase skills without the authenticated MCP database tools;
  the CLI is also unauthenticated. The migration has not been applied to Cloud,
  linked pgTAP has not run, and Cloud database types have not been generated.
- 2026-09-21: Strengthened the Phase 01 Storage RLS proof so anonymous access is
  denied for persisted objects, not merely for an empty bucket. Local repository
  checks remain green; Cloud deployment is still pending an authenticated
  database connection in this task.
- 2026-09-21: Completed Phase 01 against the linked Supabase Cloud project.
  Migration `20260921084337` is present remotely; Cloud pgTAP schema (8) and
  RLS/Storage (6) checks passed inside rolled-back transactions. Generated
  public-schema types now back the source lifecycle status types. Security
  advisors reported no findings; the two performance notices are expected
  unused-index information for a new, empty project.
- 2026-09-21: The product owner selected pre-provisioned recruiter accounts for
  the MVP, resolving the Phase 02 authentication decision gate.
- 2026-09-21: Implemented the Phase 02 cookie-based Supabase Auth boundary:
  sign-in, server-verified `/jobs`, token-refreshing Next.js Proxy, and sign-out.
  Typecheck, lint, tests, and production build pass. Browser and Cloud Auth
  verification remain pending provisioned recruiter credentials and public
  Supabase configuration for this environment.
- 2026-09-21: Completed Phase 02 against Supabase Cloud using temporary,
  email-confirmed recruiter accounts that were deleted after verification.
  Browser proof covered anonymous `/jobs` redirect, safe invalid-credential
  feedback, valid sign-in, desktop/mobile protected rendering, sign-out, and
  post-sign-out denial. Direct Cloud queries proved recruiter A could neither
  read nor update recruiter B's temporary Job. The prior Cloud pgTAP proof
  remains valid; its local rerun was unavailable because Docker Desktop was not
  running. The current typecheck, lint, test suite, production build, and
  client-bundle secret scan pass.
- 2026-09-21: The product owner accepted the Phase 03 JD boundary: a 10 MB
  limit, PDF/DOCX/TXT MIME plus signature validation, UTF-8 TXT (optional BOM),
  and retry after extraction failure without creating a Job.
- 2026-09-21: Completed Phase 03. The server upload boundary, raw-text
  extraction, draft-creation interface, and owner-folder Storage policies are
  implemented. Migration `20260921103000` is applied to Supabase Cloud; direct
  Cloud pgTAP schema (8) and RLS/Storage (8) checks pass, as do advisors,
  typecheck, lint, unit fixtures (16 tests), and production build. A headless
  browser against `next start` verified recruiter sign-in, JD TXT upload, and
  the draft success state. Cloud verification confirmed the resulting owned
  draft and private file, and denied a cross-recruiter Storage write. Temporary
  users, Jobs, and Storage objects were removed after the checks.
- 2026-09-21: Implemented Phase 04: server-only OpenAI generation with optional
  trimmed base URL, manual output validation, owned-draft persistence, and a
  generate/retry screen at `/jobs/[jobId]`. Unit tests (20), typecheck, lint,
  production build, and a client-bundle secret identifier scan pass. A live
  browser smoke test created a temporary authenticated draft but its provider
  request did not return within the runner's 30-second limit; the temporary
  user and its Jobs were removed. Keep the packet pending until successful
  provider/browser generation is observed.
- 2026-09-22: Completed Phase 04 after successful live provider/browser
  generation. The new-job flow now preserves title and description after
  generation, exposes typed editing for question IDs and Score criteria, and
  places Upload/Publish actions in the accepted order. Unit tests (28),
  typecheck, lint, production build, and the authenticated browser interaction
  pass; linked Supabase tests were intentionally skipped per product-owner
  direction.
- 2026-09-22: Completed Phase 05. Saved drafts are listed under `/jobs` and
  reopen into the shared typed Evaluation Plan editor. Questions support
  add/edit/delete, Score criteria support drag-to-reorder, type changes preserve
  the accepted transition rules, fixed importance weights remain visible, and client/server
  validation returns field-specific issues. Migration `20260922062710` fixes
  authenticated trigger execution without granting anonymous access and is
  applied to Supabase Cloud. Unit tests (35), typecheck, lint, production build,
  and authenticated desktop/mobile browser flows pass, including invalid-field
  feedback and Save draft -> reopen -> edit -> save -> reload persistence.
  Linked pgTAP was intentionally not run per product-owner direction; the new
  positive/negative authorization cases remain checked in for the next allowed
  database test run.
- 2026-09-22: Completed Phase 06. Publish now occurs only from a saved draft
  after an explicit immutable-plan acknowledgement; Cloud migration
  `20260922080000` aligns database validation with TypeScript, locks published
  slugs and plans, and provides a narrow public resolver that returns only a
  published Job's public context. Browser proof covered publish, locked view,
  published public link, close, and closed-link 404. A direct Cloud write after
  close was rejected, and simultaneous conditional publish requests produced
  exactly one transition. Unit tests (34), typecheck, lint, production build,
  generated Cloud types, and diff checks pass. The committed pgTAP lifecycle
  proof could not run in this environment because Docker Desktop is unavailable.
- 2026-09-22: Completed Phase 07. Public published-Job routes now provide a
  PDF-only (10 MB) candidate form that stores CVs privately, extracts text
  server-side, and creates a `processing` application through a service-only
  database boundary. One email may apply once per Job; valid submissions are
  capped at three per source IP per rolling hour using hashed rate records.
  Production-server verification with a real PDF proved three accepted
  applications, rate limiting, duplicate-email rejection, extraction-failure
  rollback, and private storage; all temporary users, Jobs, applications, rate
  records, and CV files were removed afterward. Unit tests (39), typecheck,
  lint, build, generated Cloud types, desktop/mobile public-form rendering, and
  diff checks pass. The committed pgTAP boundary proof could not run because
  Docker Desktop is unavailable. Production deployment must have its trusted
  proxy overwrite client-IP forwarding headers for the IP limit to be reliable.
