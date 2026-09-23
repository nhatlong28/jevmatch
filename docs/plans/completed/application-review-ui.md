# Execution Plan: Application Review UX and Job Form Alignment

Date: 2026-09-23

## Status

Completed

## Outcome

Align Create Job, application ranking, reviewer sidebar, and candidate inspector with the supplied concepts while adding persisted New / In review / Reviewed behavior.

## Context

- `DESIGN.md` and `docs/design/concepts/create-job.png`, `applications-ranking.png`
- User-provided selected-row and sidebar screenshots
- `docs/product/experience.md`, `docs/product/data-and-security.md`
- Existing `src/app/jobs/new/job-form.tsx`, `src/app/jobs/[jobId]/published-job.tsx`, Supabase schema and RLS

## Scope

In scope:

- Add Job location (the remaining role field shown in Create Job) and carry it to recruiter and public role context.
- Replace ranking preview/navigation with inline selection + evidence inspector.
- Persist first-view and reviewed timestamps; derive review labels as New, In review, Reviewed.
- Place Mark as reviewed / Open original CV in the inspector, and Copy application link / Close job in the page toolbar.
- Square, full-height desktop sidebar and updated product/design contracts.

Out of scope:

- Changes to scoring, candidate-facing review status, Hire/Reject, or external database deployment.
- Employment type and Department fields.

## Approach

1. Add the schema migration and product/domain contracts for Job location and review timestamps.
2. Update creation, public role display, and recruiter dashboard location.
3. Add an authenticated, ownership-scoped open/review server boundary and inline application inspector.
4. Align Create Job actions/layout and shell with the supplied concepts.
5. Run lint/typecheck/build and focused domain proof; keep the migration unapplied remotely.

## Risks And Recovery

- Review timestamps must not overwrite evaluated/failed processing status; add a separate review state.
- A first-view transition is sticky and Reviewed remains Reviewed on reopening.
- Existing Jobs migrate with null location and remain readable; new Create Job submissions require location.
- Migration rollback is reversible by dropping only the newly added nullable columns and restoring prior UI contract.

## Progress

- [x] Read workflow, product authority, relevant Next.js and Supabase guidance, code and visual references.
- [x] Add migration and align domain/product contracts.
- [x] Implement Create Job and ranking interactions.
- [x] Run static checks and record result.

## Decisions

- 2026-09-23: Derive status as reviewed_at → Reviewed; otherwise first_viewed_at → In review; otherwise New. Opening a Reviewed application does not revert it.
- 2026-09-23: First view means deliberate application selection, not initial page render.
- 2026-09-23: Persist location as nullable for existing data; require it only for new jobs as shown by the reference.

## Validation

- Focused proof: no unit/integration tests run; state transitions and ownership scope were reviewed in code.
- Integration or end-to-end proof: migration is applied and confirmed on the linked Supabase project; authenticated UI was not visually exercised.
- Repository-required checks: `npm run lint`, `npm run typecheck`, `npm run build` passed.

## Result

Completed 2026-09-23.

- Create Job now persists required location and lets recruiters save before
  generating a plan; existing jobs remain valid with null location. Department
  and Employment type remain excluded.
- Application selection opens an inline evidence inspector; first-view and
  reviewed timestamps derive the requested review labels and preserve Reviewed
  on reopen.
- The desktop sidebar is square-edged and full-height; ranking toolbar actions
  match the requested placement.
- Lint, typecheck, and production build passed. Tests and authenticated visual
  inspection were not run. The checked-in migration was applied to the linked
  Supabase project with user approval and confirmed by migration status.
