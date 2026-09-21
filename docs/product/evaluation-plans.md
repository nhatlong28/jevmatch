# Evaluation Plans

## Model

An Evaluation Plan contains at least one uniquely identified question. Each
question has an importance of `required`, `core`, or `preferred` and exactly one
Jev primitive:

- `noul`: self-contained yes/no judgment instructions;
- `score`: self-contained instructions plus at least two non-empty criteria,
  ordered from weakest to strongest match.

`Choice` is forbidden. MVP validation uses TypeScript types and a manual runtime
validator, not Zod.

## Draft generation

The server sends `{ jdText }` to an OpenAI-compatible LLM and expects an
Evaluation Plan. Roughly ten questions is a generation target, not a constraint.

Generated questions must evaluate one job-related dimension, contain unique IDs,
include explicit thresholds when the JD has them, avoid protected attributes,
and never produce numeric weights, Match Score, or a hiring decision. The output
must pass the manual validator before persistence.

The generated plan is always a draft. It has no authority until reviewed by the
recruiter.

## Draft editing

While the Job is `draft`, the recruiter may add, edit, delete, reorder, change
importance, switch Score/Noul, and edit Score criteria. IDs are stable and not
directly edited in the UI.

- Score to Noul removes criteria while preserving ID and importance.
- Noul to Score requires valid ordered criteria before save.

## Publish validation

Publishing requires at least one question, unique IDs, non-empty instructions,
valid type and importance, and at least two non-empty criteria for every Score.

Publishing atomically validates the plan, sets Job status to `published`, creates
or preserves a unique public slug, and makes the plan immutable. Every candidate
for the Job is evaluated with that exact plan.
