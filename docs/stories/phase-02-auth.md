# Phase 02 — Recruiter Authentication

## Outcome

A recruiter can authenticate with Supabase and protected pages resolve only for
the current user.

## Authority

- `docs/product/access-and-lifecycle.md`
- `docs/product/data-and-security.md`
- `docs/product/experience.md`

## Dependencies

Phase 01 schema and ownership policies.

## Scope

- Supabase browser/server clients using the publishable key where appropriate.
- Email/password sign-in and logout.
- Server-side session enforcement for `/jobs` and descendants.
- Redirect unauthenticated protected requests to `/sign-in`.
- Ownership checks remain in RLS and server boundaries.

## Accepted decision

The MVP uses pre-provisioned recruiter accounts. The sign-in experience has no
self-service signup path; administrators create recruiter accounts in Supabase
Auth.

## Acceptance criteria

- Valid recruiter credentials reach `/jobs`; invalid credentials show a safe
  actionable error.
- Anonymous navigation to a protected route redirects to `/sign-in`.
- Signing out invalidates access to protected routes.
- Recruiter A cannot retrieve or mutate recruiter B's Job through page, action,
  route-handler, or direct Supabase paths.
- Auth cookies and server secrets are not serialized into client components.

## Proof and exit gate

Auth integration tests and a browser sign-in/sign-out flow pass, including the
negative ownership case.
