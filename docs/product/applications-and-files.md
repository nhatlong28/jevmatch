# Applications and File Processing

## Job Description processing

The recruiter can paste a Job Description or upload a PDF, DOCX, or TXT file.
Uploads are limited to 10 MB. The server requires the declared MIME type and
file signature to agree (`application/pdf`, DOCX, or `text/plain` UTF-8 with an
optional BOM), stores the original in the private `job-descriptions` bucket,
extracts raw text, and passes only that text to the LLM. File parsers do not
interpret hiring requirements. If extraction fails, no Job is created and the
recruiter can try again.

## Public application

`/apply/[slug]` loads only a published Job. The candidate submits exactly the MVP
fields: full name, email, and CV. The candidate does not authenticate and sees a
neutral success confirmation after a successful submission.

The public endpoint validates slug, published status, required fields, file type,
and file size. CVs are PDF-only, no larger than 10 MB, and require both the
`application/pdf` MIME type and PDF signature. A candidate email may submit once
per Job. The endpoint accepts at most three valid submissions per source IP in a
rolling hour; rate-limit records store only a hash of the source IP.

## Resume processing

The server validates the CV, stores it in the private `resumes` bucket, extracts
resume text, loads the immutable published plan, invokes Jev, and persists the
result and deterministic Match Score.

An application must not be scored if extraction or Jev evaluation fails. The
source specification proposes `processing`, `evaluated`, and `failed` statuses;
their exact retry and user-visible behavior must be fixed in the Phase 7/8
packets before implementation.

## Original files

Neither bucket exposes public URLs. To open a CV, the server verifies Job
ownership and returns a short-lived signed URL. Service-role credentials and raw
resume text never enter client bundles or public responses.
