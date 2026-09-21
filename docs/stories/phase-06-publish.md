# Phase 06 — Publish and Immutable Plan

## Outcome

The owning recruiter can publish a valid Job exactly once, locking one plan for
all candidate evaluations and activating a public slug.

## Authority

- `docs/product/evaluation-plans.md`
- `docs/product/access-and-lifecycle.md`
- `docs/product/data-and-security.md`
- `docs/product/experience.md`

## Dependencies

Phases 01–05.

## Scope

- Publish review and explicit immutability communication.
- Atomic plan validation, status transition, and unique slug creation/preservation.
- Read-only published plan behavior.
- Close transition that disables new submissions without deleting prior data.

## Acceptance criteria

- Invalid plans cannot publish.
- Publish changes `draft` to `published` and activates `/apply/[slug]`.
- UI, server actions, direct database calls, and concurrent requests cannot alter
  the plan after publish.
- A slug resolves only published Jobs; closed Jobs reject new submissions.
- Every application references the same locked plan through its Job.

## Proof and exit gate

Transaction/concurrency tests and negative immutability tests pass at the chosen
database enforcement layer; browser publish/read-only/close flows pass.
