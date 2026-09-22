# Jev Match Design System

This document is the implementation contract for the Jev Match MVP interface.
The visual references in `docs/design/concepts/` illustrate the intended result;
this document defines the reusable rules behind them.

## Product character

Jev Match should feel calm, precise, and auditable. It is decision-support
software for hiring teams, not a game, a social network, or an autonomous hiring
system. Dense information is welcome when hierarchy and spacing remain clear.

Use an editorial enterprise aesthetic:

- warm-white page background and true-white work surfaces;
- charcoal text with cool-gray secondary text and borders;
- one restrained cobalt-blue interactive accent;
- compact typography and disciplined alignment;
- flat surfaces with shadow used only to separate an overlay or sticky inspector;
- explicit evidence and plain-language explanations over decorative data display.

## Experience thesis

The core Jev Match loop is:

```text
Job Description → editable Evaluation Plan → immutable published plan
→ candidate CV → processing state → deterministic evidence review
```

The interface must make that chain visible without implying that Jev makes a
hiring decision. Recruiters approve the plan, review the evidence, and retain
judgment. Candidates submit only the information required to apply and never
see internal evaluation data.

The product has two deliberately separate surfaces:

| Surface | User | Primary feeling | Information boundary |
| --- | --- | --- | --- |
| Recruiter workspace | Provisioned recruiter | Calm, precise, auditable | Owned Jobs, plans, applications, scores, evidence, and authorized CV links |
| Candidate application | Unauthenticated candidate | Simple, private, reassuring | Published Job context, full name, email, CV, and neutral confirmation only |

Do not blend these surfaces through shared navigation, score language, or
candidate-facing status details.

## MVP experience map

| Screen | Route | Primary job | Primary action |
| --- | --- | --- | --- |
| Sign in | `/sign-in` | Authenticate an existing recruiter account | Sign in |
| Jobs dashboard | `/jobs` | See owned Jobs and candidate volume | New job / Review |
| Create Job | `/jobs/new` | Add role context and Job Description | Upload or paste JD |
| Evaluation editor | `/jobs/[jobId]` while draft | Review and refine the generated plan | Save draft / Publish plan |
| Public application | `/apply/[slug]` | Submit a candidate application | Submit application |
| Published Job review | `/jobs/[jobId]` | Monitor lifecycle and rank applications | Open candidate |
| Candidate detail | `/jobs/[jobId]/applications/[applicationId]` | Inspect score evidence and original CV | Open original CV |

The only recruiter lifecycle is `draft → published → closed`. Published plans
are read-only. A closed Job keeps existing recruiter review data but rejects new
candidate submissions.

## Frontend information architecture

The recruiter experience is one connected workspace, not a collection of
independent pages:

```text
Jobs dashboard
  └─ select a Job
       ├─ draft Job → Create / edit Evaluation Plan
       └─ published or closed Job → Application ranking
                                      └─ select a candidate → Candidate detail

Public application link → Candidate application
```

The Job is the organizing object. Every recruiter-facing screen should make the
current Job context clear and provide a predictable way back to the Job list or
the current Job's application ranking.

### Route responsibility

| Route | Experience responsibility | Continuity requirement |
| --- | --- | --- |
| `/jobs` | Track all recruiter-owned Jobs, lifecycle, recency, and candidate counts | `New job` is the primary action; each Job opens its workspace |
| `/jobs/new` | Start a new draft Job and provide a JD | Reuse the authenticated recruiter shell and page-header rhythm |
| `/jobs/[jobId]` draft | Create, edit, validate, and publish the Evaluation Plan | Keep Job title/status visible while editing |
| `/jobs/[jobId]` published/closed | Show Job context and rank applications | Candidate rows open the detail page; return goes to this ranking |
| `/jobs/[jobId]/applications/[applicationId]` | Inspect one candidate's evidence and original CV | Breadcrumb returns to the same Job ranking |
| `/settings` | Reserved account/workspace settings destination | Keep the shell destination minimal; define detailed settings behavior separately |
| `/apply/[slug]` | Let a candidate submit an application | Use a separate public shell; never expose recruiter navigation or data |

### The unified recruiter shell

All protected recruiter routes use the same shell:

- fixed left navigation on desktop;
- Jev Match wordmark at the top;
- exactly two primary navigation items: `Jobs` and `Settings`;
- an `Account` block at the bottom for the signed-in recruiter and sign-out;
- fluid content area with the same page inset and maximum reading width;
- one page header pattern: breadcrumb, title, short context, status, actions;
- one surface language for tables, forms, editor rows, and evidence sections.

The shell must not reset as the recruiter moves from dashboard to Job ranking to
candidate detail. Navigation, spacing, type scale, button vocabulary, status
treatments, and back-navigation semantics remain stable.

On mobile, the shell becomes a compact header and navigation sheet. The current
Job and page title remain visible after navigation; do not force the user to
infer where they are from a URL or an icon alone.

`Settings` is the only secondary recruiter destination. `Account` is the
signed-in identity/control block, not a third product module: it may open a
small account menu for profile identity and sign-out, but it must not imply a
candidate, team, or organization workflow. Do not add Applications, Candidates,
Reports, Home, Team, or other navigation items unless a separate product
decision authorizes them.

### The separate candidate shell

The candidate application is intentionally not a condensed recruiter screen. It
uses a public shell with:

- a small Jev Match wordmark;
- published Job context;
- one focused submission flow;
- no recruiter sidebar, score language, application ranking, or internal status.

The public shell shares typography, colors, control height, focus behavior, and
error conventions with the recruiter shell, but not its navigation or data.

### Minimal rounded sidebar

The sidebar is a quiet navigation rail, not a second dashboard. Use a single
rounded surface with generous internal whitespace, two primary destinations, and
one account control:

```text
┌────────────────────────┐
│  ◇  Jev Match          │
│                        │
│  ▣  Jobs               │
│  ⚙  Settings           │
│                        │
│                        │
│  ────────────────────  │
│  (AD)  Account         │
│        recruiter email │
│                    ↪   │
└────────────────────────┘
```

- Sidebar surface: `surface`, one subtle border, 18px outer radius, no heavy
  shadow.
- Sidebar padding: 16px; gap between navigation items: 8px.
- Navigation item height: 44px, 12px radius, icon plus sentence-case label.
- Active item: `primary-soft` background with cobalt text and icon; avoid a
  separate decorative marker when the rounded active surface already provides
  sufficient feedback.
- Inactive item: transparent background with muted text; use a quiet hover state.
- Account block: anchored to the bottom, separated by one divider, with an
  avatar, the `Account` label, display name, email, and a labeled sign-out
  action.
- The sidebar therefore exposes `Jobs`, `Settings`, and `Account` as the only
  visible destinations/controls. Account remains visually subordinate to the
  two primary navigation items and does not become a standalone workspace.

Rounded corners should communicate containment and touch affordance. Do not turn
every control into a pill: reserve fully rounded shapes for compact status
badges or avatars.

## Foundations

### Color roles

Use semantic tokens rather than raw colors in components.

| Token | Reference value | Use |
| --- | --- | --- |
| `background` | `#F8FAFC` | App canvas and public page background |
| `surface` | `#FFFFFF` | Tables, forms, inspectors, and navigation |
| `foreground` | `#0F172A` | Primary text and icons |
| `muted-foreground` | `#64748B` | Supporting text, timestamps, descriptions |
| `border` | `#DCE3ED` | Dividers and control outlines |
| `primary` | `#0967F2` | Primary actions, focus, active navigation |
| `primary-soft` | `#EAF2FF` | Selected rows and active navigation background |
| `success` | `#159455` | Valid and published states |
| `success-soft` | `#EAF8F0` | Success callouts |
| `warning` | `#B76A08` | In-review and recoverable warning states |
| `warning-soft` | `#FFF5D9` | Warning backgrounds |
| `danger` | `#D92D20` | Destructive text actions and invalid states |

Color never carries meaning alone. Pair status color with text and, where useful,
an icon.

### Typography

- Primary family: Geist Sans or the closest system sans fallback.
- Monospace family: Geist Mono for identifiers or technical output only.
- Page title: 36px/40px, weight 650 on desktop; 30px/36px on small screens.
- Section title: 22px/28px, weight 650.
- Body: 15px/22px, weight 400.
- Compact/table text: 14px/20px.
- Labels and metadata: 13px/18px, weight 500.
- Avoid all-caps labels and display-size marketing typography inside the product.

### Spacing and shape

- Base spacing unit: 4px. Prefer 8, 12, 16, 24, 32, and 48px steps.
- App sidebar: 248px desktop width with an 18px outer radius.
- Main content: 32px desktop inset, 24px tablet, 16px mobile.
- Work surfaces: 14px radius; sidebar: 18px radius; navigation items: 12px
  radius; controls: 10px radius.
- Buttons are 40px high by default and 36px when compact.
- Use one-pixel borders. Avoid nested bordered containers without a functional
  reason.

## Shell and navigation

- The authenticated desktop shell has a fixed left sidebar and a fluid content
  area shared by `/jobs`, `/jobs/new`, Job workspaces, and candidate detail. The
  wordmark anchors the top; the signed-in user anchors the bottom.
- The sidebar contains exactly two primary items: `Jobs` and `Settings`, plus
  the bottom `Account` identity/control block. Active navigation uses cobalt
  text, a soft-blue rounded background, and a familiar icon. Inactive items stay
  neutral.
- `Jobs` is the navigation home; application ranking is reached through a Job
  rather than an invented standalone Applications module. `Settings` is the
  only secondary destination in the shell. Account only exposes signed-in
  identity and sign-out controls.
- On small screens, collapse navigation into a sheet opened from the page header.
- Public candidate pages have no authenticated navigation. Use a centered content
  column and a small Jev Match wordmark/footer.

### Shared page frame

Every protected page follows the same frame:

```text
┌──────────────────┬──────────────────────────────────────────────┐
│ Jev Match        │ Breadcrumb                                   │
│                  │ Page title                         [Action]   │
│ Jobs             │ Short context / lifecycle status              │
│ Settings         │                                              │
│                  │                                              │
│                  │ Main page surface                             │
│                  │                                              │
│ Recruiter        │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

Use the frame as a structural contract, not a requirement to duplicate empty
cards. The main surface changes by route, but the alignment of the header,
primary action, content inset, and navigation must remain recognizable.

### Consistency rules across screens

- Use the same verbs everywhere: `New job`, `Review`, `Save draft`, `Publish`,
  `Close job`, `Open original CV`, and `Back to applications`.
- Put the primary action in the same page-header position. Destructive or
  irreversible actions remain secondary and require explicit confirmation.
- Show lifecycle status beside the page title or at the start of the relevant
  surface; do not hide it in a distant footer.
- Use one bordered work surface for a collection or form region. Do not turn
  every field, metric, or criterion into a separate floating card.
- Use the same row interaction: the role/candidate name is the text link, while
  supporting metadata remains secondary.
- Preserve context when navigating deeper: Job title and candidate name should
  be available in breadcrumbs or the page header.
- Keep score, dates, statuses, and labels aligned in stable columns so the
  recruiter's eye can scan across Jobs and applications without relearning the
  layout.

## Core patterns

### Page headers

Use an optional breadcrumb, a direct page title, one short supporting sentence,
and right-aligned actions. The primary action is always rightmost. Status sits next
to the title when it changes the page's behavior.

### Data tables

Tables are the default for job and application collections. Use a single bordered
surface, persistent column headers, compact 72–82px rows, and subtle row dividers.
Selection uses `primary-soft` plus a cobalt outline. Sorting and filters must have
visible labels or accessible names.

### Forms

Use labels above inputs and helper or error text below. Group related fields with
spacing and dividers, not a card per field. Focus uses a two-pixel cobalt ring with
sufficient offset. Preserve entered values after recoverable errors.

### Evaluation editor

- Present evaluation questions as structured rows with stable ID, Type,
  Importance, Instructions/Description, and actions. The visual concept's
  criterion/table treatment is a presentation pattern, not permission to change
  the domain model.
- Only `Score` and `Noul` are valid criterion types.
- Importance is one of Required, Core, or Preferred.
- A `Score` question exposes its ordered criteria; a `Noul` question does not.
  Score criteria can be edited and reordered, while question order is not
  directly rearranged in the MVP.
- Keep the weighting explanation visible: Required ×3, Core ×2, Preferred ×1.
- State explicitly that importance affects final scoring and is not sent to Jev.
- Draft provenance is informational, not a decorative AI badge.
- Publishing must communicate that the plan becomes immutable.

### Application evidence

- Display match score as a neutral summary, never as a trophy, rank medal, or
  hiring recommendation.
- Keep the caution that reviewers must inspect the full application.
- Each criterion shows its type, normalized result, and concise evidence excerpt.
- Do not render Hire or Reject actions in the MVP.
- Resume access is a secondary action and must use authorized signed URLs.

### Status and feedback

Status treatments are compact rounded rectangles, not large pills. Success,
warning, and error callouts use a tinted background, one icon, a short title, and
optional supporting sentence. Loading states reserve final layout space. Empty
states explain the next valid action without illustration.

## Screen contracts

### Jobs dashboard

The dashboard is the recruiter's tracking home. Use a quiet summary strip
followed by one sortable Jobs table. The dashboard must make it easy to answer:
which Jobs exist, which are active, and where candidate review is needed.

- Header: `Jobs`, short context, and `New job`.
- Summary: Open roles, Drafts, and Candidates.
- Filters: search by role, skill, or location; filter by lifecycle status and
  location when those values exist. Never add an Owner filter.
- Table: Role, Status, Candidates, Updated, and Review/actions. Do not render an
  Owner column or owner avatar: the MVP lists only the signed-in recruiter's
  Jobs and has no shared ownership/team workflow.
- Role is the visual anchor; lifecycle and candidate volume are secondary.
- Published and closed Jobs both open the same Job workspace, with the
  application ranking visible for review.
- Draft Jobs open the Evaluation Plan editing workflow.

Search, filters, and bulk actions are optional later enhancements. They must not
create an unsupported standalone Applications navigation destination.

### Create job

Use the same recruiter shell and page header as the dashboard. The main content
is a wide role-details and Job Description form with a narrow validation rail.
Role details are limited to the supported Job context: a required Job title and
the existing optional location value, when available. Do not add the concept's
`Department` or `Employment type` fields; they are sample content outside the
MVP contract. Support pasted text and file upload as alternate inputs. Explain
that generation produces an editable draft and occurs server-side. The user
should always be able to return to Jobs without losing recoverable input.

### Evaluation plan

Use a wide criterion editor with a sticky summary/validation rail inside the
current Job workspace. Keep the Job title, draft status, and breadcrumb visible.
Save draft and Publish plan are visually distinct. Published plans replace
editing controls with read-only presentation and move the primary path toward
application ranking.

### Candidate application

Use a centered column no wider than 780px. Lead with company and role context,
then one continuous application form. Resume upload, private-storage copy, and
submission status must be obvious on mobile and desktop. The MVP form fields are
exactly full name, email, and PDF CV. The concept's phone, LinkedIn/portfolio,
and consent controls are sample content outside the current contract and must
not be implemented. Candidates never see match scores.

### Applications and candidate detail

The published/closed Job workspace is the ranking surface. On wide screens, pair
the application table with a selected-candidate inspector when the viewport can
support it. On narrower screens, navigate to a full candidate-detail page.

The navigation sequence must remain obvious:

```text
Jobs → Job workspace → Applications ranking → Candidate detail
```

The ranking surface contains Candidate, Match Score, Status, and Applied. A
candidate row opens detail; the candidate's name is the link, not the entire row,
so the interaction remains accessible and predictable. Preserve filter and
selection state when returning to the list. Do not copy the concept's LinkedIn,
location, qualitative evidence badge, or review-status fields into the MVP list
unless the persisted product contract gains those fields.

Candidate detail starts with identity and status, then a neutral Match Score,
then criterion evidence, and finally the original CV action. It should feel like
an audit record attached to the Job, not a separate profile product.

## UX blueprints

### Jobs dashboard blueprint

Keep the first viewport quiet and useful:

1. Page header with `Jobs`, one sentence of context, and `New job` as the clear
   primary action.
2. Summary strip for Open roles, Drafts, and Candidates. These are orientation
   signals, not interchangeable marketing cards.
3. One bordered Job table where Role is the visual anchor and Status, Candidates,
   Updated, and Review are secondary.
4. Empty state that explains the next valid action: create a draft Job.

Search, filters, and bulk actions are optional later enhancements. They must not
introduce unsupported recruiter workflows or distract from the single-job review
loop.

### Create Job and Evaluation Plan blueprint

Use a two-column desktop composition:

- Main column: role title, optional supported location, paste/upload Job
  Description, extraction feedback, and generated evaluation questions.
- Validation rail: file constraints, generation progress, validation issues, and
  plan counts.

The generated plan is an editable draft, not an answer. The editor must make the
following visible in the same context:

- `Noul` or `Score` type;
- stable question ID;
- Required/Core/Preferred importance;
- instructions and ordered Score criteria;
- fixed weights: Required ×3, Core ×2, Preferred ×1;
- the fact that importance is used by deterministic scoring and is not sent to
  Jev.

Question rows should follow the project's editable-plan logic rather than the
image's grouped headings: add/edit/delete questions, edit IDs and instructions,
change type and importance, and edit/reorder Score criteria. Do not expose
Department, Employment type, Owner, or unsupported candidate fields as part of
the evaluation plan.

Publishing is a deliberate review step. Show an immutable-plan warning before
the final action and replace editing controls with read-only content afterward.

### Candidate application blueprint

Use a centered public column with no authenticated shell. The page should answer
three questions in order: what role is this, what do I need to provide, and what
happens after submission?

- Role context and published Job title.
- Full name, email, and PDF CV only.
- File constraints and private-storage explanation beside the upload control.
- Reserved space for uploading, extraction, validation, and neutral success or
  retry feedback.

Do not add phone, LinkedIn, consent, portfolio, score, or internal review fields
unless the product contract changes.

### Application review blueprint

Use a dense but readable table for the collection view:

| Column | Display rule |
| --- | --- |
| Candidate | Name as primary text, email as secondary text |
| Match Score | `NN / 100` only when persisted and validated; otherwise `—` |
| Status | `Evaluated`, `Processing`, or `Evaluation unavailable` |
| Applied | Compact localized date |

Evaluated records with a valid score appear first, descending by score. Records
without a score remain visible but never receive a fabricated value.

The detail page is evidence-first. Start with candidate identity and status, then
the neutral score summary, then criterion evidence, then the secondary original
CV action. Never add Hire, Reject, “Top candidate”, or qualitative labels.

## State and copy matrix

Use explicit text with status color and, where useful, an icon. Color alone must
never carry the state.

| State | Meaning | Recommended copy |
| --- | --- | --- |
| Draft | Recruiter can still edit the Job and plan | `Draft` / `Continue editing` |
| Published | New applications are accepted and the plan is locked | `Published` / `Review applications` |
| Closed | New applications are disabled; existing data remains available | `Closed` / `Review existing applications` |
| Processing | CV is stored and evaluation is in progress | `Processing` / `Evaluation is still processing.` |
| Evaluated | Valid evidence and deterministic score are available | `Evaluated` |
| Failed | Evaluation did not produce a usable score | `Evaluation unavailable` / `Try again or inspect the original CV.` |

Loading states should reserve the final layout space. Recoverable errors must
preserve entered form values. Empty states should explain the next valid action,
not merely state that data is missing.

## Visual concept references

Use the existing concept images as layout references rather than copying sample
content into the product:

- `docs/design/concepts/jobs-dashboard.png` — recruiter workspace shell and Job table;
- `docs/design/concepts/create-job.png` — Job Description intake and generation;
- `docs/design/concepts/evaluation-plan.png` — criterion editor and publish review;
- `docs/design/concepts/candidate-application.png` — public candidate form;
- `docs/design/concepts/applications-ranking.png` — application ranking and evidence review.

Generated image concepts may explore composition and hierarchy, but production
UI must use semantic tokens, real product copy, accessible controls, and the
repository's native components.

## Responsive behavior

- Desktop (`>= 1200px`): fixed sidebar; two-column editor and list/inspector views.
- Tablet (`768–1199px`): collapsible navigation; stack summary rails below primary
  content; tables may scroll horizontally with the first column kept readable.
- Mobile (`< 768px`): single column; full-width actions; table collections become
  accessible compact rows; candidate application remains a continuous form.
- Do not shrink controls below a 44px touch target on candidate-facing mobile UI.

## Motion and accessibility

- Use 120–180ms transitions for hover, focus, selection, and opening overlays.
- Respect reduced-motion preferences; no ambient or decorative animation.
- Meet WCAG AA contrast and maintain visible keyboard focus everywhere.
- Every icon-only control needs an accessible label and tooltip when its meaning is
  not universal.
- Errors must be announced and connected to the relevant control.

## Avoid

- gradients, glassmorphism, or decorative background blobs;
- dashboards made from interchangeable cards;
- excessive badges, rounded pills, or shadows;
- unsupported navigation destinations or product promises;
- AI sparkle motifs or copy suggesting autonomous hiring decisions;
- candidate-facing score, criterion evidence, or internal review state.
