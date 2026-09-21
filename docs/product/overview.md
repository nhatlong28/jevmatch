# Jev Match Product Overview

## Outcome

Jev Match helps an individual recruiter turn a Job Description into a reviewed,
published Evaluation Plan, evaluate candidate resumes consistently through Jev,
and prioritize manual review with a deterministic Match Score.

The system supports human judgment. It never makes a hiring or rejection
decision.

## Core workflow

1. An authenticated recruiter creates a draft Job and uploads a JD.
2. The server stores the original privately, extracts text, and asks an LLM for
   an Evaluation Plan draft.
3. The recruiter edits and approves the plan while the Job is `draft`.
4. Publishing locks the plan and activates a public application URL.
5. A candidate submits name, email, and CV without creating an account.
6. The server stores and extracts the CV, then asks Jev to evaluate the resume
   against the published plan.
7. TypeScript code normalizes results, applies fixed importance weights, and
   calculates Match Score.
8. The owning recruiter reviews ranked applications, criterion results, and the
   original CV before making any hiring decision.

## Product principles

- LLM proposes what to evaluate; the recruiter approves the final plan.
- Jev evaluates one resume against the approved, self-contained questions.
- TypeScript—not an AI model—calculates the final score.
- Every candidate for one Job uses the same immutable published plan.
- Scores are review aids, not predictions or decisions.
- Candidate data, plans, evaluations, and scores are private by default.

## MVP scope

The MVP includes Supabase Auth for recruiters; recruiter-owned Jobs; private JD
and CV storage; PDF, DOCX, and TXT extraction; editable Score/Noul plans; public
candidate submission; TypeSafe/Jev evaluation; deterministic scoring; recruiter
job/application/detail views; and signed access to original CVs.

The MVP excludes organizations, shared Job ownership, complex roles, candidate
accounts, interview scheduling, email automation, ATS/calendar integrations,
evidence extraction, AI score explanations, automatic hiring/rejection,
post-publish versioning, re-evaluation with a new plan, and the `Choice`
primitive.

## Completion outcome

The MVP is complete only when the full workflow is proven through executable
tests and rendered interaction, including ownership isolation, immutable plans,
private files, server-only secrets, candidate score privacy, and deterministic
scoring.
