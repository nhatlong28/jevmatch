# Product Docs

This directory contains current consumer-product behavior derived from real
accepted intent. Harness deliberately ships no fake product domains.

When a user provides a product specification, derive smaller living documents
here instead of keeping one growing specification as the operating manual. Name
files after actual product domains, such as `overview.md`, `billing.md`,
`permissions.md`, or `api-conventions.md`.

## Current Product Contract

Jev Match product authority is split into the following living documents:

- [`overview.md`](overview.md): product outcome, scope, principles, and success.
- [`access-and-lifecycle.md`](access-and-lifecycle.md): actors, authentication,
  ownership, and Job lifecycle.
- [`evaluation-plans.md`](evaluation-plans.md): plan schema, generation, editing,
  validation, and publish immutability.
- [`applications-and-files.md`](applications-and-files.md): JD/CV processing,
  candidate submission, and private file access.
- [`ai-and-scoring.md`](ai-and-scoring.md): OpenAI, TypeSafe/Jev, normalization,
  deterministic weighting, and score semantics.
- [`data-and-security.md`](data-and-security.md): data model, RLS, Storage,
  secrets, and public-boundary requirements.
- [`experience.md`](experience.md): routes, screens, UI behavior, and preserved
  visual-prototype policy.
- [`traceability.md`](traceability.md): mapping from the source `SPEC.md` to the
  living product documents and delivery packets.

`SPEC.md` remains the accepted source baseline. These smaller documents are the
operating authority for implementation. A change that conflicts with `SPEC.md`
must be resolved explicitly rather than silently copied into these documents.

## Update Rule

When behavior changes:

1. Update the affected product document when the expected behavior changed.
2. Update the active execution plan when complex work uses one.
3. Add a lasting decision only when future work must inherit a consequential
   product, architecture, data, security, compatibility, or validation choice.
4. Add or update executable proof that exercises the behavior.

Bounded changes do not require a parallel lifecycle record.
