# Phase 05 — Evaluation Editor

## Outcome

The owning recruiter can turn the generated draft into the final Evaluation Plan
while the Job remains editable.

## Authority

- `docs/product/evaluation-plans.md`
- `docs/product/access-and-lifecycle.md`
- `docs/product/experience.md`
- `DESIGN.md`

## Dependencies

Phases 01–04.

## Scope

- Render, add, edit, and delete questions.
- Change importance and switch Score/Noul.
- Edit and drag to reorder Score criteria, and display fixed importance weights.
- Save valid drafts and show field-specific validation errors.
- Reuse the preserved Evaluation Plan concept and visual components.

## Acceptance criteria

- Editor is available only to the owning recruiter for a `draft` Job.
- Score to Noul removes criteria; Noul to Score cannot save without at least two
  non-empty ordered criteria.
- IDs remain stable during other edits, may be edited directly, and must remain
  non-empty and unique.
- At least one question, unique IDs, valid importance/type, and non-empty
  instructions are enforced on the server even if the UI is bypassed.
- UI states that importance affects deterministic scoring and is not sent to Jev.

## Proof and exit gate

Reducer/domain tests cover every edit transition and invalid state; authorization
tests bypass the UI; desktop/mobile browser flows match the preserved concept.
