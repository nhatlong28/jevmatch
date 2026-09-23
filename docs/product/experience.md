# Routes and Product Experience

## Routes

Public routes are `/sign-in` and `/apply/[slug]`. Protected routes are `/jobs`,
`/jobs/new`, `/jobs/[jobId]`, and
`/jobs/[jobId]/applications/[applicationId]`. Draft editing may use the Job route
or an optional `/jobs/[jobId]/edit` route.

## Required screens

- Sign in: simple Supabase email/password authentication.
- Jobs: only the current recruiter's Jobs and a New Job action.
- Create Job: enter role details and JD, then either save the draft or generate
  an evaluation plan; after review, publish directly or keep it as a draft.
- Evaluation Editor: add/edit/delete questions; edit type and importance; and
  drag to reorder Score criteria while draft.
- Publish review: plan counts and explicit immutability confirmation.
- Published Job: public link plus applications sorted by Match Score descending,
  with inline candidate selection and evidence inspector.
- Candidate application: Job context plus full name, email, CV, and confirmation.
- Application detail: overall score, raw/normalized criterion results, importance,
  weight/contribution, optional confidence, and original CV action. The ranking
  keeps this inspector inline rather than navigating away.

## Visual direction

`DESIGN.md` and `docs/design/concepts/` are preserved visual references. Their
calm enterprise hierarchy, table-first layout, restrained cobalt accent, compact
typography, responsive behavior, and audit-friendly evidence presentation should
be reused throughout implementation.

The current Jobs dashboard is a preserved visual prototype. It is not proof that
Phase 10 behavior exists: it uses sample data, currently renders at `/`, and may
show sample navigation or fields outside the MVP. Later work should retain its
visual quality while connecting it to authenticated `/jobs` data and removing or
adapting unsupported content.

Candidates never see scores or internal evaluation state. Product copy never
suggests automatic hiring judgment or gamifies rankings.
