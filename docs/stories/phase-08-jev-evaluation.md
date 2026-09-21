# Phase 08 — TypeSafe/Jev Evaluation

## Outcome

The server evaluates extracted resume text against the Job's immutable plan with
typed Jev primitives and persists auditable raw results.

## Authority

- `docs/product/ai-and-scoring.md`
- `docs/product/evaluation-plans.md`
- `docs/product/data-and-security.md`

## Dependencies

Phases 01, 06, and 07.

## Scope

- `@typesafe-ai/sdk`, `TypeSafeClient`, and default `jev-latest` model.
- Deterministic conversion of Noul/Score plan questions to TypeSafe primitives.
- Jev state exactly `{ resume: resumeText }`.
- Provider-result validation, persistence, failure state, and safe retry behavior.

## Acceptance criteria

- JD text, importance, numeric weights, and hiring decisions never enter Jev
  state/questions.
- Every published question maps once to the correct primitive and result ID.
- Score criteria preserve weakest-to-strongest ordering.
- Invalid, missing, or out-of-contract provider results are not passed to scoring.
- API key and raw resume remain server-only and sensitive values are not logged.

## Proof and exit gate

Type-level and mocked SDK contract tests prove conversion/state shape and failure
handling; one controlled integration fixture proves the current SDK response can
be validated before Phase 09.
