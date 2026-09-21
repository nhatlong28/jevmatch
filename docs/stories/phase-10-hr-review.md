# Phase 10 — Recruiter Dashboard and Application Review

## Outcome

The owning recruiter can review their Jobs, rank evaluated applications by Match
Score, inspect criterion results, and open the original CV without exposing data
to other recruiters or candidates.

## Authority

- `docs/product/experience.md`
- `docs/product/access-and-lifecycle.md`
- `docs/product/ai-and-scoring.md`
- `docs/product/data-and-security.md`
- `DESIGN.md` and `docs/design/concepts/`

## Dependencies

Phases 01–09.

## Preserved UI reuse

Keep the current Jobs dashboard visual quality, semantic tokens, shadcn source
components, responsive layout, table hierarchy, and all five concept images.
Replace sample data with authenticated queries, move protected Jobs behavior from
`/` to `/jobs`, and adapt sample navigation/content only where product authority
requires it. Do not discard or redesign the visual system without a new decision.

## Scope

- Recruiter-owned Job list and lifecycle/status information.
- Published Job application list sorted by Match Score descending.
- Application detail with raw/normalized results, importance, weight,
  contribution, optional confidence, and neutral score semantics.
- Ownership-checked temporary signed URL for the original CV.
- Loading, empty, processing, evaluated, failed, and authorization-safe states.

## Acceptance criteria

- Only the current recruiter's Jobs/applications appear across UI and server
  boundaries.
- Default evaluated-application order is Match Score descending; processing or
  failed records are represented without fabricated scores.
- Candidate detail matches persisted results and never shows Hire/Reject actions.
- Signed CV URLs are created only after ownership verification and expire.
- Candidate/public routes cannot access the dashboard, score, or detail payloads.
- Desktop and mobile preserve the accepted visual language and accessibility.

## Proof and exit gate

Query/authorization tests, signed-URL negative tests, score-order fixtures, and
browser flows for list/detail/responsive states pass. The existing prototype is
not marked complete until these data-backed checks succeed.
