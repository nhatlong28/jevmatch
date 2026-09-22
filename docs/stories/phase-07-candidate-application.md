# Phase 07 — Candidate Application and CV Processing

## Outcome

An unauthenticated candidate can submit name, email, and a supported CV to a
published Job without gaining access to internal evaluation data.

## Authority

- `docs/product/applications-and-files.md`
- `docs/product/access-and-lifecycle.md`
- `docs/product/data-and-security.md`
- `docs/product/experience.md`
- `DESIGN.md`

## Dependencies

Phases 01, 03, and 06.

## Accepted decisions

- CVs are PDF-only, limited to 10 MB, and require MIME plus signature checks.
- A candidate email can submit only once for a Job.
- Public submissions are limited to three valid submissions per source IP per
  rolling hour.
- Extraction failure creates neither an application nor a stored CV; the
  candidate can retry with another file.

## Scope

- Public Job view for valid published slugs.
- Candidate form with only full name, email, and CV.
- Private resume upload and PDF/DOCX/TXT extraction.
- Server-mediated application creation and neutral confirmation.
- Reuse the preserved candidate visual concept while removing/adapting sample
  phone, LinkedIn, or other unsupported fields.

## Acceptance criteria

- Draft, closed, invalid, or cross-Job slugs do not accept submissions.
- Candidate cannot read plan JSON, scores, evaluations, resume text, application
  lists, or private URLs.
- Invalid fields/files fail before durable application processing begins.
- Valid submission creates one processing record linked to the published Job and
  stores the original CV privately.
- Retry/failure behavior follows the accepted decision gates and avoids orphaned
  files or duplicate processing.

## Proof and exit gate

Public-boundary integration tests, malicious/invalid upload tests, privacy tests,
and desktop/mobile browser submission flows pass.
