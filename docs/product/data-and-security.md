# Data and Security

## Data model

`jobs` owns title, optional location, recruiter ID, original JD path/text,
Evaluation Plan, unique public slug, lifecycle status, and timestamps.
`applications` owns Job ID, candidate name/email, original CV path/text, Match
Score, evaluations, processing status, first-view timestamp, reviewed timestamp,
and timestamps. Review status is derived: `reviewed_at` means Reviewed;
otherwise `first_viewed_at` means In review; neither means New. Marking reviewed
requires that the recruiter has opened the application. Reopening a reviewed
application does not clear its reviewed timestamp.

Applications derive recruiter ownership through `applications.job_id ->
jobs.recruiter_id`; they do not duplicate recruiter ID.

## Row-level security

- Enable RLS on both tables.
- Recruiters may select, insert, and update only Jobs where recruiter ID equals
  `auth.uid()`.
- Recruiters may read applications only when the parent Job is theirs.
- Candidate submission goes through a Next.js server boundary, not direct public
  client insertion.
- Published-plan immutability must be enforced below the presentation layer; the
  exact database enforcement is established and negatively tested in Phase 6.

## Storage and secrets

- `job-descriptions` and `resumes` are private buckets.
- CV access uses ownership-checked, temporary signed URLs.
- `SUPABASE_SECRET_KEY`, `LLM_API_KEY`, and `TYPESAFE_API_KEY` are
  server-only and never use a `NEXT_PUBLIC_` prefix.
- Only the Supabase URL and publishable key are public client configuration.
- Secrets are never committed.

## Public boundary

The application endpoint exposes only published Job information needed to apply.
It never exposes plan JSON, evaluations, scores, application lists, resume text,
or private Storage URLs. It validates payload and files before persistence.

Rate limiting is recommended by the source specification but no quota or key is
accepted. Implementation must pause until those policy choices are supplied.
File malware scanning is outside the MVP and required for production hardening
only if separately accepted.
