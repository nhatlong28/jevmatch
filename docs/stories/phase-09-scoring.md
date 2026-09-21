# Phase 09 — Deterministic Match Scoring

## Outcome

Valid Jev results are normalized and aggregated by deterministic TypeScript into
a reproducible Match Score.

## Authority

- `docs/product/ai-and-scoring.md`
- `docs/product/evaluation-plans.md`

## Dependencies

Phases 01 and 08.

## Scope

- Normalize Noul and Score results to `[0, 1]`.
- Join results to question importance without sending importance to Jev.
- Apply fixed 3/2/1 weights and calculate a 0–100 weighted score.
- Persist raw value, normalized score, importance, weight, optional confidence,
  and final Match Score.

## Acceptance criteria

- Score normalization uses `raw / (criteria.length - 1)`; Noul uses its numeric
  truth value.
- Missing, non-finite, out-of-range, duplicate, or unknown results fail validation
  instead of silently influencing a score.
- Fixed weights are required=3, core=2, preferred=1.
- Confidence never affects Match Score.
- Same plan/results always produce the same score independent of order.
- No result produces a Hire/Reject or qualitative candidate label.

## Proof and exit gate

Unit and property/boundary tests cover zero, endpoints, fractional results, mixed
importance, reordering, and invalid provider data; a stored fixture recomputes to
the persisted score exactly.
