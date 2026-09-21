# AI Integrations and Scoring

## Evaluation-plan LLM

Use the official `openai` JavaScript/TypeScript package on the server. Configure
the model with `LLM_MODEL` and API key with `LLM_API_KEY`.

`LLM_BASE_URL` is optional. Trim it and omit the `baseURL` property entirely when
it is empty so the package uses its default endpoint. Validate provider output
with the manual Evaluation Plan validator before storing it.

## Jev evaluation

Use `@typesafe-ai/sdk` and `TypeSafeClient.systemOne`. The default model is
`jev-latest`, overridable by `TYPESAFE_DEFAULT_MODEL`; the API key is
`TYPESAFE_API_KEY`.

Convert plan questions to TypeSafe `noul` or `score` primitives. Jev state is
exactly:

```ts
{ resume: resumeText }
```

Do not send the JD, importance, numeric weights, or hiring decisions to Jev.

## Normalization

- Noul normalized score is its numeric truth result in `[0, 1]`.
- For Score with `N` criteria, `maxScore = N - 1` and normalized score is
  `rawScore / maxScore`.
- Provider values must be validated and bounded before aggregation.

## Deterministic aggregation

Importance weights are fixed:

```text
required = 3
core = 2
preferred = 1
```

```text
Match Score = sum(normalizedScore * weight) / sum(weight) * 100
```

Jev confidence is optional metadata and never becomes Match Score. The score is
not a hiring probability, performance prediction, auto-reject signal, or hiring
decision. UI labels must remain neutral and must not say Hire, Reject, Excellent,
or Bad.
