# Phase 03 — Draft Job and JD Processing

## Outcome

An authenticated recruiter can create an owned draft Job from a supported Job
Description file, with original file and extracted text stored privately.

## Authority

- `docs/product/applications-and-files.md`
- `docs/product/access-and-lifecycle.md`
- `docs/product/data-and-security.md`
- `docs/product/experience.md`

## Dependencies

Phases 01–02.

## Scope

- `/jobs/new` role details and JD upload/paste experience.
- PDF, DOCX, and TXT validation and raw-text extraction.
- Private upload to `job-descriptions` and creation of an owned `draft` Job.
- Clear pending, success, extraction failure, and retry-safe states.

## Decision gate

Choose maximum JD size, MIME/content-sniffing rules, supported text encodings,
and extraction-library/failure behavior before implementing the upload boundary.

## Acceptance criteria

- Only supported, valid files within the accepted size are persisted.
- Parser output is raw text and is not interpreted by an LLM in this phase.
- Failed extraction does not create a publishable Job or orphan an unrecoverable
  file.
- Created Job is `draft`, belongs to the current recruiter, and is invisible to
  other recruiters and candidates.
- The preserved Create Job visual concept guides layout without adding fields not
  authorized by product docs.

## Proof and exit gate

Fixture tests cover all supported file types and invalid inputs; storage and
ownership integration tests pass; browser upload flow exposes recoverable states.
