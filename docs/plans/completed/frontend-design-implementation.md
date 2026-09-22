# Execution Plan: Design System Frontend Implementation

Date: 2026-09-23

## Status

Completed

## Outcome

The existing recruiter and candidate routes render the screen contracts in
`DESIGN.md`: a shared Jobs/Settings/Account recruiter shell, table-first review
surfaces, a two-column Job creation and Evaluation Plan workflow, and a focused
public application form.

## Context

- `DESIGN.md`
- `docs/product/experience.md`
- `docs/product/evaluation-plans.md`
- `docs/product/applications-and-files.md`
- `docs/product/access-and-lifecycle.md`

## Scope

In scope:

- Shared protected-route shell and minimal Settings route.
- Restyle the existing Jobs, Job creation, draft Evaluation Plan, published Job,
  application detail, candidate application, and sign-in surfaces.
- Compose existing shadcn/ui primitives and add only missing primitives required
  for the documented interactions.
- Preserve all existing server/API/domain behavior.

Out of scope:

- New persistence fields, recruiter preferences, search/filter APIs, or product
  modules.
- Changes to scoring, publication, upload validation, authentication, or RLS.

## Approach

1. Introduce a reusable protected shell and reuse it across `/jobs` routes.
2. Implement the documented visual hierarchy and responsive behavior on each
   existing page, keeping interactivity in narrow client components.
3. Validate static correctness and production compilation; visually inspect an
   isolated local run if the environment has usable application configuration.

## Risks And Recovery

- Shared layout can alter route nesting: retain existing page data boundaries and
  validate every route with `next build`.
- Visual refactors can regress form controls: preserve field names, actions, and
  client-side state transitions; tests/type checking catch contract drift.
- Rollback is a targeted revert of frontend files only; APIs and database state
  are untouched.

## Progress

- [x] Build shared recruiter shell and Settings route.
- [x] Implement Jobs and Create Job visual contracts.
- [x] Implement Evaluation Plan, application ranking/detail, candidate, and
  sign-in visual contracts.
- [x] Run static/build proof and visual QA where available.

## Decisions

- 2026-09-23: Treat concept-only fields and navigation as visual samples;
  product documents remain authoritative for rendered data and actions.
- 2026-09-23: Keep most pages as Server Components and confine stateful filters,
  editor controls, and menus to their existing or narrowly scoped client files.

## Validation

- Focused proof: route/UI type checking and existing domain tests.
- Repository-required checks: `npm run lint`, `npm run typecheck`, `npm test`,
  and `npm run build`.
- Visual proof: desktop and mobile local browser inspection when startup is
  possible without inventing credentials/configuration.

## Result

Completed 2026-09-23.

- Added a shared responsive recruiter shell with the allowed Jobs, Settings, and
  Account controls; `/settings` is protected by both proxy matching and the
  route layout.
- Restyled the existing product routes using the documented cobalt/slate token
  system and existing shadcn/ui primitives. No API, data model, scoring,
  authorization, or upload behavior changed.
- `npm run lint`, `npm run typecheck`, `npm test` (63 tests), and `npm run build`
  passed.
- Visual QA: local `/sign-in` was inspected at desktop and 390px mobile widths;
  the browser console had no warnings or errors. Authenticated screens require a
  real Supabase session and were compiled rather than populated with fabricated
  application data.
