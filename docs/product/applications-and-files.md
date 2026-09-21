# Applications and File Processing

## Job Description processing

The recruiter uploads PDF, DOCX, or TXT. The server validates the file, stores the
original in the private `job-descriptions` bucket, extracts raw text, and passes
only that text to the LLM. File parsers do not interpret hiring requirements.

## Public application

`/apply/[slug]` loads only a published Job. The candidate submits exactly the MVP
fields: full name, email, and CV. The candidate does not authenticate and sees a
neutral success confirmation after a successful submission.

The public endpoint validates slug, published status, required fields, file type,
and file size. The maximum upload size, MIME/content-sniffing policy, duplicate
submission behavior, and rate-limit quota require explicit decisions before this
boundary is implemented.

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
