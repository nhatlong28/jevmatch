# Access and Job Lifecycle

## Actors

### Recruiter

A recruiter has a Supabase Auth account. They may sign in/out, create and view
their own Jobs, edit draft Jobs and plans, publish or close Jobs, copy public
links, review applications and Jev results, view Match Scores, and request a
temporary signed URL for an original CV.

A recruiter may not access another recruiter's Job or its applications and may
not edit a published Evaluation Plan.

### Candidate

A candidate has no account. Through a published public link they may read the
Job and submit full name, email, and CV.

A candidate may not see the Evaluation Plan, importance values, Jev results,
Match Score, resume text, other candidates, or internal review state.

## Authentication and ownership

- Supabase Auth is the only recruiter authentication system.
- Protected routes require an authenticated recruiter.
- Job ownership is `auth.uid() === jobs.recruiter_id`.
- Application ownership is derived through its Job.
- RLS is mandatory; server-side checks supplement rather than replace it.

Whether the MVP exposes self-service signup or uses provisioned recruiter
accounts is not resolved by the source specification and must be decided before
the authentication story is implemented.

## Job lifecycle

```text
draft -> published -> closed
```

### Draft

The recruiter may edit Job data and the Evaluation Plan. Candidate application
is unavailable.

### Published

The public application route accepts submissions. The Evaluation Plan is
immutable for both UI and server/database writes.

### Closed

New submissions are rejected. The owning recruiter retains read access to prior
applications and files.

No transition back to `draft` is defined. Job deletion is not part of the MVP
unless separately accepted.
