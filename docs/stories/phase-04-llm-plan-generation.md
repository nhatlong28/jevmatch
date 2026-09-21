# Phase 04 — LLM Evaluation-Plan Draft

## Outcome

The server converts extracted JD text into a valid, editable Evaluation Plan
draft without exposing provider credentials or accepting malformed output.

## Authority

- `docs/product/evaluation-plans.md`
- `docs/product/ai-and-scoring.md`
- `docs/product/data-and-security.md`

## Dependencies

Phases 01 and 03.

## Scope

- Official `openai` package in a server-only module.
- `LLM_API_KEY`, `LLM_MODEL`, and optional trimmed `LLM_BASE_URL`.
- Prompt/structured response conversion for roughly ten Score/Noul questions.
- Manual validation before saving the plan to the draft Job.
- Recoverable provider, timeout, parse, and validation failures.

## Acceptance criteria

- Empty `LLM_BASE_URL` omits `baseURL`; a configured value is passed exactly.
- Only `{ jdText }` and generation instructions are used; no candidate data is
  involved.
- Output contains no Choice, numeric weight, Match Score, protected attribute, or
  hiring decision and every question is self-contained.
- Invalid provider output is not persisted and leaves the draft recoverable.
- Provider keys and response internals do not enter client bundles or logs.

## Proof and exit gate

Mocked provider contract tests cover default/custom base URL and malformed output;
server/client boundary checks and a rendered generate/retry flow pass.
