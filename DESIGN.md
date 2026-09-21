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
- App sidebar: 248px desktop width.
- Main content: 32px desktop inset, 24px tablet, 16px mobile.
- Work surfaces: 10px radius; controls: 8px radius.
- Buttons are 40px high by default and 36px when compact.
- Use one-pixel borders. Avoid nested bordered containers without a functional
  reason.

## Shell and navigation

- The authenticated desktop shell has a fixed left sidebar and a fluid content
  area. The wordmark anchors the top; the signed-in user anchors the bottom.
- Active navigation uses cobalt text, a soft-blue background, and a narrow blue
  leading marker. Inactive items stay neutral.
- Keep the primary navigation limited to the routes supported by the MVP. Do not
  imply unimplemented modules.
- On small screens, collapse navigation into a sheet opened from the page header.
- Public candidate pages have no authenticated navigation. Use a centered content
  column and a small Jev Match wordmark/footer.

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

- Present criteria as structured, reorderable rows with Criterion, Type,
  Importance, Description, and actions.
- Only `Score` and `Noul` are valid criterion types.
- Importance is one of Required, Core, or Preferred.
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

Use a quiet summary strip followed by search/filters and a sortable jobs table.
Role is the visual anchor; status, candidate count, recency, owner, and actions are
secondary. The New job action remains visible above the fold.

### Create job

Use a wide role-details and job-description form with a narrow validation rail.
Support pasted text and file upload as alternate inputs. Explain that generation
produces an editable draft and occurs server-side.

### Evaluation plan

Use a wide criterion editor with a sticky summary/validation rail. Save draft and
Publish plan are visually distinct. Published plans replace editing controls with
read-only presentation.

### Candidate application

Use a centered column no wider than 780px. Lead with company and role context,
then one continuous application form. Resume upload, privacy copy, and submission
status must be obvious on mobile and desktop. The MVP form fields are only full
name, email, and CV; phone, LinkedIn, or consent controls in a visual concept are
sample content rather than requirements. Candidates never see match scores.

### Applications and candidate detail

On wide screens, pair the application table with a selected-candidate inspector.
On narrower screens, navigate to a full candidate-detail page. Preserve filter and
selection state when returning to the list.

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
