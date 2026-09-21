# Jev Match Delivery Story Packets

These consumer-owned packets turn the accepted product contract into resumable,
phase-sized delivery work. They do not restore the retired Harness control plane
or create a second task database. `docs/plans/active/jev-match-mvp.md` remains the
single execution plan; packets define phase behavior and proof.

## Packet contract

Every packet names its outcome, authority, dependencies, in/out scope, acceptance
criteria, security boundaries, validation, decision gates, and exit condition.
A later packet may be refined, but implementation cannot weaken an earlier
accepted boundary.

## Delivery order

1. [`phase-01-core-data.md`](phase-01-core-data.md)
2. [`phase-02-auth.md`](phase-02-auth.md)
3. [`phase-03-job-creation.md`](phase-03-job-creation.md)
4. [`phase-04-llm-plan-generation.md`](phase-04-llm-plan-generation.md)
5. [`phase-05-evaluation-editor.md`](phase-05-evaluation-editor.md)
6. [`phase-06-publish.md`](phase-06-publish.md)
7. [`phase-07-candidate-application.md`](phase-07-candidate-application.md)
8. [`phase-08-jev-evaluation.md`](phase-08-jev-evaluation.md)
9. [`phase-09-scoring.md`](phase-09-scoring.md)
10. [`phase-10-hr-review.md`](phase-10-hr-review.md)

## Preserved visual prototype

The existing Next.js scaffold, `DESIGN.md`, concept images, shadcn components, and
Jobs dashboard are retained. They are implementation inputs, not completed story
evidence. Phase 10 will reuse the current dashboard's visual language and
components while replacing sample data and moving protected behavior to `/jobs`.
