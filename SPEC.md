# SPEC — Jev Match

## 1. Tổng quan

**Jev Match** là một ứng dụng tuyển dụng AI-first dành cho HR/recruiter.

Mục tiêu chính:

- HR tạo một Job bằng cách upload Job Description (JD).
- Hệ thống trích xuất text từ JD.
- LLM đọc JD và sinh một **Evaluation Plan mặc định khoảng 10 câu hỏi**.
- Mỗi câu hỏi chỉ sử dụng một trong hai primitive của Jev:
  - `Score`
  - `Noul`
- HR review và chỉnh sửa Evaluation Plan khi Job còn ở trạng thái `draft`.
- HR có thể:
  - sửa nội dung câu hỏi;
  - thêm câu hỏi;
  - xóa câu hỏi;
  - đổi `importance`;
  - đổi `type` giữa `Score` và `Noul`;
  - chỉnh `criteria` của `Score`.
- Sau khi HR publish Job:
  - Evaluation Plan bị khóa;
  - hệ thống sinh public application link;
  - candidate apply qua link này mà không cần tài khoản.
- Candidate upload CV.
- Hệ thống trích xuất text từ CV và gửi `resume` + Evaluation Plan sang Jev.
- Jev trả các evaluation result.
- Code TypeScript normalize result, áp weight và tính `Match Score`.
- HR xem danh sách application theo Match Score và có thể mở chi tiết từng candidate.

Hệ thống **không tự động tuyển hoặc loại ứng viên**. Match Score chỉ dùng để hỗ trợ HR ưu tiên review.

---

# 2. Phạm vi MVP

## 2.1. Trong scope

- Supabase Auth cho HR.
- Mỗi HR chỉ xem được Job do chính họ tạo.
- Candidate không cần auth.
- Upload JD:
  - PDF
  - DOCX
  - TXT
- Extract text từ JD.
- LLM generate Evaluation Plan.
- Evaluation Editor cho HR.
- Publish Job.
- Public application URL.
- Candidate submit:
  - name
  - email
  - CV
- Upload CV:
  - PDF
  - DOCX
  - TXT nếu cần
- Extract resume text.
- Jev evaluation.
- Normalize result.
- Weighted scoring.
- HR Job Dashboard.
- Application ranking.
- Application detail.
- View original CV.
- Supabase Postgres.
- Supabase Storage.
- Supabase RLS.

## 2.2. Ngoài scope MVP

- Organization / team / company workspace.
- Nhiều HR cùng sở hữu một Job.
- Role/permission phức tạp.
- Candidate account.
- Candidate dashboard.
- Interview scheduling.
- Email automation.
- ATS integration.
- Calendar integration.
- Evidence extraction.
- AI explanation của score.
- Auto reject / auto hire.
- Question versioning sau publish.
- Re-evaluate bằng Evaluation Plan mới.
- `Choice` primitive.
- Zod.
- FastAPI.
- Clerk.
- ORM bắt buộc.

---

# 3. Tech Stack

## Frontend / Backend

- Next.js
- TypeScript
- App Router
- React
- Tailwind CSS
- shadcn/ui

Next.js được sử dụng full-stack:

- UI
- Server Components
- Route Handlers / Server Actions
- Auth-aware server logic
- File processing orchestration
- LLM integration
- Jev integration
- Scoring

## Authentication

- Supabase Auth

Chỉ HR/recruiter cần login.

## Database

- Supabase Postgres

## File Storage

- Supabase Storage

Buckets:

- `job-descriptions`
- `resumes`

Cả hai nên là private bucket.

## AI

- LLM:
  - sử dụng package `openai` chính thức cho TypeScript/JavaScript;
  - chạy server-side;
  - hỗ trợ `baseURL` tùy chọn cho OpenAI-compatible endpoint;
  - đọc JD text;
  - generate Evaluation Plan ban đầu.

- Jev:
  - sử dụng package `@typesafe-ai/sdk`;
  - gọi `TypeSafeClient.systemOne` với model mặc định `jev-latest`;
  - đọc `resume`;
  - trả typed judgments theo Evaluation Plan.

---

# 4. Actors

## 4.1. Recruiter / HR

Có Supabase account.

Có thể:

- login;
- logout;
- xem Job của chính mình;
- tạo Job;
- upload JD;
- review/edit Evaluation Plan;
- publish Job;
- copy public apply link;
- xem applications;
- xem Match Score;
- xem raw Jev evaluation;
- xem original CV;
- đóng Job.

Không thể:

- xem Job của recruiter khác;
- sửa Evaluation Plan sau publish.

## 4.2. Candidate

Không cần account.

Có thể:

- mở public apply URL;
- đọc Job;
- nhập name;
- nhập email;
- upload CV;
- submit application.

Không thể xem:

- Evaluation Plan;
- weight;
- Jev results;
- Match Score;
- candidate khác.

---

# 5. Job Lifecycle

```text
draft
  ↓
published
  ↓
closed
```

## `draft`

HR được phép:

- edit Job;
- edit Evaluation Plan;
- add question;
- delete question;
- change type;
- change importance;
- edit Score criteria.

Candidate chưa được apply.

## `published`

- Public apply link hoạt động.
- Evaluation Plan bị khóa.
- HR không được edit Evaluation Plan.
- Candidate có thể apply.

## `closed`

- Public apply link không nhận application mới.
- HR vẫn xem được dữ liệu cũ.

---

# 6. Workflow tổng thể

```text
                        HR
                         │
                  Supabase Auth
                         │
                         ▼
                    Create Job
                         │
                    Upload JD
                         │
                         ▼
                   Extract text
                         │
                         ▼
                        LLM
                         │
             Generate ~10 questions
                  Score + Noul
                         │
                         ▼
             ┌─────────────────────┐
             │ Evaluation Editor   │
             │                     │
             │ Edit question       │
             │ Add question        │
             │ Delete question     │
             │ Change importance   │
             │ Change type         │
             │ Edit criteria       │
             └──────────┬──────────┘
                        │
                     Publish
                        │
                        ▼
              Evaluation Plan LOCKED
                        │
                        ▼
                Public Apply Link
                        │
                        ▼
                    Candidate
                        │
                    Upload CV
                        │
                        ▼
                  Extract text
                        │
                        ▼
                       Jev
                        │
              N evaluation results
                        │
                        ▼
                    Normalize
                        │
                        ▼
              Importance weights
                        │
                        ▼
                   Match Score
                        │
                        ▼
                   HR Dashboard
```

---

# 7. JD Processing

## 7.1. Input

HR upload một file JD.

Supported:

- `.pdf`
- `.docx`
- `.txt`

## 7.2. Processing

```text
JD file
  ↓
validate file
  ↓
upload original file to Supabase Storage
  ↓
extract text
  ↓
jdText
  ↓
LLM
```

## 7.3. Responsibilities

File parser chỉ làm:

> file → raw text

LLM chỉ làm:

> JD text → Evaluation Plan

Không dùng LLM để xử lý file byte nếu không cần.

---

# 8. Evaluation Plan

## 8.1. Nguyên tắc

LLM generate khoảng 10 questions mặc định.

`10` không phải constraint.

HR có thể thêm hoặc xóa câu hỏi trước publish.

Final Evaluation Plan có thể có:

- 6 questions;
- 8 questions;
- 10 questions;
- 12 questions;
- hoặc số lượng khác.

Hệ thống chỉ yêu cầu ít nhất một question.

## 8.2. Allowed primitive

Chỉ sử dụng:

- `Score`
- `Noul`

Không sử dụng:

- `Choice`

## 8.3. Importance

Mỗi question có:

```ts
type Importance =
  | "required"
  | "core"
  | "preferred"
```

Mapping weight:

```ts
const IMPORTANCE_WEIGHT = {
  required: 3,
  core: 2,
  preferred: 1,
} as const
```

HR được đổi importance khi Job còn `draft`.

---

# 9. Evaluation Plan TypeScript Schema

```ts
export type Importance =
  | "required"
  | "core"
  | "preferred"

export type NoulQuestion = {
  id: string
  importance: Importance

  jev: {
    type: "noul"
    instructions: string
  }
}

export type ScoreQuestion = {
  id: string
  importance: Importance

  jev: {
    type: "score"
    instructions: string
    criteria: string[]
  }
}

export type EvaluationQuestion =
  | NoulQuestion
  | ScoreQuestion

export type EvaluationPlan = {
  questions: EvaluationQuestion[]
}
```

Không sử dụng Zod trong MVP.

Có thể dùng TypeScript type + validator thủ công.

---

# 10. LLM Question Generation

## 10.1. Input

```ts
{
  jdText: string
}
```

## 10.2. Output

```ts
EvaluationPlan
```

## 10.3. Generation rules

LLM phải:

- generate khoảng 10 questions mặc định;
- chỉ dùng `Score` và `Noul`;
- mỗi question chỉ đánh giá một dimension;
- gán `importance`;
- tạo `id` unique;
- question phải self-contained;
- không reference `job_description`;
- nếu requirement có threshold cụ thể, phải ghi threshold trong `instructions`;
- `Score.criteria` phải có thứ tự từ match yếu nhất → mạnh nhất;
- dùng `Noul` cho yes/no rõ ràng;
- dùng `Score` khi có partial satisfaction / depth / proficiency / relevance / scope / ownership / transferability;
- chỉ đánh giá qualification liên quan trực tiếp đến công việc.

LLM không generate:

- numeric weight;
- Match Score;
- hiring decision;
- protected/personal attributes.

## 10.4. Example

```json
{
  "questions": [
    {
      "id": "minimum_backend_experience",
      "importance": "required",
      "jev": {
        "type": "noul",
        "instructions": "Does `resume` demonstrate at least 5 years of professional backend engineering experience?"
      }
    },
    {
      "id": "typescript_proficiency",
      "importance": "required",
      "jev": {
        "type": "score",
        "instructions": "Rate the professional TypeScript proficiency demonstrated by `resume`.",
        "criteria": [
          "No relevant TypeScript experience.",
          "Limited exposure.",
          "Some professional usage.",
          "Regular production usage.",
          "Strong expertise with production ownership.",
          "Deep expertise across complex production systems."
        ]
      }
    }
  ]
}
```

## 10.5. LLM Client

LLM integration sử dụng package `openai` chính thức và chỉ chạy server-side.

```ts
import OpenAI from "openai"

const baseURL = process.env.LLM_BASE_URL?.trim()

const llm = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  ...(baseURL ? { baseURL } : {}),
})
```

`LLM_BASE_URL` là optional. Khi không được cấu hình, không truyền `baseURL`
vào client để package `openai` sử dụng endpoint mặc định.

Model được đọc từ `LLM_MODEL`. LLM response phải được chuyển thành
`EvaluationPlan` và kiểm tra bằng validator TypeScript thủ công trước khi lưu.

---

# 11. Evaluation Editor

Evaluation Editor chỉ hoạt động khi:

```text
job.status === "draft"
```

## 11.1. HR có thể

- edit question;
- add question;
- delete question;
- change importance;
- change type;
- edit Score criteria.

## 11.2. HR không cần

- edit question ID;
- biết JSON;
- biết Jev implementation details;
- nhập numeric weight.

## 11.3. Score → Noul

Khi đổi từ `Score` sang `Noul`:

- bỏ `criteria`;
- giữ `id`;
- giữ `importance`;
- HR sửa `instructions`.

## 11.4. Noul → Score

Khi đổi từ `Noul` sang `Score`:

- HR phải thêm ordered criteria;
- không cho save nếu criteria không hợp lệ.

## 11.5. Minimum validation

Trước khi publish:

- phải có ít nhất 1 question;
- mỗi question phải có unique `id`;
- `instructions` không được empty;
- type chỉ là `score` hoặc `noul`;
- `importance` phải hợp lệ;
- `score` phải có ít nhất 2 criteria;
- criteria phải có nội dung.

---

# 12. Publish Job

Khi HR nhấn `Publish`:

1. validate Evaluation Plan;
2. update Job status thành `published`;
3. Evaluation Plan trở thành immutable;
4. generate / giữ `public_slug`;
5. public application page bắt đầu hoạt động.

Ví dụ:

```text
https://example.com/apply/k8Ws92Ax
```

Sau publish:

- không edit;
- không add;
- không delete;
- không change type;
- không change importance;
- không edit criteria.

Lý do: tất cả candidate phải được chấm bằng cùng một Evaluation Plan.

---

# 13. Candidate Apply Workflow

```text
/apply/[publicSlug]
        ↓
load published Job
        ↓
show Job information
        ↓
candidate enters:
- full name
- email
- CV
        ↓
submit
```

Candidate không cần Supabase Auth.

## Candidate UI

```text
Senior Backend Engineer

Job Description
...

Full name
[________________________]

Email
[________________________]

Resume
[ Upload CV ]

[ Apply ]
```

Sau submit:

```text
Application submitted.
```

Không hiển thị Match Score cho candidate trong MVP.

---

# 14. CV Processing

## Input

- candidate name;
- candidate email;
- CV file;
- Job slug.

## Processing

```text
CV file
 ↓
validate
 ↓
upload private Supabase Storage
 ↓
extract resume text
 ↓
load Job Evaluation Plan
 ↓
Jev
```

---

# 15. Jev State

Jev state chỉ chứa resume:

```ts
const state = {
  resume: resumeText,
}
```

Không chứa:

```ts
job_description
```

Lý do:

- JD đã được compile thành Evaluation Plan;
- questions phải self-contained;
- mọi candidate cùng một Job dùng chính xác cùng một plan.

---

# 16. Jev Questions

Backend sử dụng `@typesafe-ai/sdk` để convert Evaluation Plan thành `questions`
object dùng cho Jev.

Concept:

```ts
import {
  noul,
  score,
  TypeSafeClient,
} from "@typesafe-ai/sdk"

function toJevQuestions(plan: EvaluationPlan) {
  return Object.fromEntries(
    plan.questions.map((question) => {
      if (question.jev.type === "noul") {
        return [
          question.id,
          noul(question.jev.instructions),
        ] as const
      }

      const criteria = question.jev.criteria as [
        string,
        string,
        ...string[],
      ]

      return [
        question.id,
        score(question.jev.instructions, criteria),
      ] as const
    })
  )
}

const jev = new TypeSafeClient()

const response = await jev.systemOne({
  state: {
    resume: resumeText,
  },
  questions: toJevQuestions(evaluationPlan),
})
```

`TypeSafeClient` đọc API key từ `TYPESAFE_API_KEY` và mặc định dùng model
`jev-latest`. Có thể override model bằng `TYPESAFE_DEFAULT_MODEL` mà không thay
đổi Evaluation Plan.

`importance` không gửi sang Jev.

`importance` chỉ được dùng bởi Scoring Engine.

---

# 17. Jev Result Normalization

Mục tiêu:

```text
Score / Noul
     ↓
normalized score
     ↓
[0, 1]
```

## 17.1. Noul

Ví dụ:

```text
0.94 true
```

Normalized:

```ts
normalized = 0.94
```

## 17.2. Score

Nếu Score criteria có `N` levels thì max index là:

```ts
maxScore = criteria.length - 1
```

Normalized:

```ts
normalized = rawScore / maxScore
```

Ví dụ:

```text
4.2 / 5
→ 0.84
```

---

# 18. Scoring Engine

Weight:

```ts
const IMPORTANCE_WEIGHT = {
  required: 3,
  core: 2,
  preferred: 1,
} as const
```

Final Match:

```text
              Σ(normalizedScore × weight)
Match Score = ──────────────────────────── × 100
                       Σ(weight)
```

Example:

```ts
export function calculateMatch(
  evaluations: EvaluationResult[]
) {
  let weightedSum = 0
  let totalWeight = 0

  for (const evaluation of evaluations) {
    const weight =
      IMPORTANCE_WEIGHT[evaluation.importance]

    weightedSum +=
      evaluation.normalizedScore * weight

    totalWeight += weight
  }

  return totalWeight === 0
    ? 0
    : (weightedSum / totalWeight) * 100
}
```

Không dùng Jev confidence làm Match Score.

---

# 19. Match Score Semantics

Match Score là:

> weighted aggregation của các Jev judgments theo Evaluation Plan đã được HR approve.

Match Score không phải:

- xác suất ứng viên được tuyển;
- dự đoán performance tương lai;
- quyết định tuyển dụng;
- auto reject signal.

UI nên diễn đạt:

```text
Match
86.4%
```

Không nên dùng label như:

- Excellent candidate
- Bad candidate
- Hire
- Reject

---

# 20. Data Model

## 20.1. `jobs`

```sql
jobs
--------------------------------

id                  uuid primary key
recruiter_id        uuid not null
title               text
jd_file_path        text
jd_text              text
evaluation_plan     jsonb
public_slug         text unique
status              text
created_at          timestamptz
updated_at          timestamptz
```

`recruiter_id` reference:

```text
auth.users.id
```

Status:

```text
draft
published
closed
```

## 20.2. `applications`

```sql
applications
--------------------------------

id                  uuid primary key
job_id              uuid not null

candidate_name      text
candidate_email     text

resume_file_path    text
resume_text         text

match_score         numeric
evaluations         jsonb

status              text
created_at          timestamptz
updated_at          timestamptz
```

Suggested status:

```text
processing
evaluated
failed
```

Không cần `recruiter_id` trong `applications`.

Ownership:

```text
Application
   ↓ job_id
Job
   ↓ recruiter_id
Supabase User
```

---

# 21. Evaluation Result Schema

```ts
export type EvaluationResult = {
  questionId: string

  type:
    | "score"
    | "noul"

  importance:
    | "required"
    | "core"
    | "preferred"

  rawValue: number
  normalizedScore: number
  weight: number

  confidence?: number
}
```

Có thể lưu thêm fields cần thiết từ raw Jev response nếu UI cần.

---

# 22. Authentication

Chỉ sử dụng:

- Supabase Auth

Không dùng:

- Clerk;
- Auth.js;
- custom password auth.

HR login:

```text
/sign-in
 ↓
Supabase Auth
 ↓
/jobs
```

Candidate không login.

---

# 23. Authorization

Rule:

> Recruiter chỉ được xem và thao tác trên Job do chính họ tạo.

Ownership:

```text
auth.uid() === jobs.recruiter_id
```

Bảo vệ bằng:

- Supabase RLS;
- server-side ownership checks khi cần.

---

# 24. RLS — Jobs

Enable RLS:

```sql
alter table jobs enable row level security;
```

Read:

```sql
create policy "Recruiters can read own jobs"
on jobs
for select
using (
  recruiter_id = auth.uid()
);
```

Insert:

```sql
create policy "Recruiters can create own jobs"
on jobs
for insert
with check (
  recruiter_id = auth.uid()
);
```

Update:

```sql
create policy "Recruiters can update own jobs"
on jobs
for update
using (
  recruiter_id = auth.uid()
);
```

Delete nếu hỗ trợ:

```sql
create policy "Recruiters can delete own jobs"
on jobs
for delete
using (
  recruiter_id = auth.uid()
);
```

---

# 25. RLS — Applications

HR chỉ đọc applications của Job do họ sở hữu.

Concept:

```sql
create policy "Recruiters can read applications of own jobs"
on applications
for select
using (
  exists (
    select 1
    from jobs
    where jobs.id = applications.job_id
      and jobs.recruiter_id = auth.uid()
  )
);
```

Candidate submission nên đi qua Next.js server thay vì client insert trực tiếp vào Supabase.

---

# 26. Storage Security

Buckets:

```text
job-descriptions
resumes
```

Nên là private.

Không public CV URL.

HR muốn xem original CV:

```text
request
 ↓
server checks Job ownership
 ↓
create signed URL
 ↓
return temporary URL
```

Service role key:

- chỉ dùng server-side;
- không expose qua `NEXT_PUBLIC_*`.

---

# 27. Routes

## Public

```text
/sign-in
/apply/[slug]
```

## Protected

```text
/jobs
/jobs/new
/jobs/[jobId]
/jobs/[jobId]/applications/[applicationId]
```

Optional:

```text
/jobs/[jobId]/edit
```

Chỉ hoạt động khi Job là `draft`.

---

# 28. Suggested API / Server Actions

## Job

```text
createJob
uploadJobDescription
generateEvaluationPlan
updateEvaluationPlan
publishJob
closeJob
getJobs
getJob
```

## Application

```text
submitApplication
getApplications
getApplication
```

## AI

```text
generateEvaluationPlan(jdText)
```

## Jev

```text
evaluateResume(resumeText, evaluationPlan)
```

## Scoring

```text
normalizeEvaluation(...)
calculateMatch(...)
```

---

# 29. UI Screens

## 29.1. Sign In

Simple Supabase Auth UI.

```text
Jev Match

Email
[________________]

Password
[________________]

[ Sign in ]
```

OAuth có thể thêm sau.

---

## 29.2. Jobs

```text
Jobs

Senior Backend Engineer
47 applications

Frontend Engineer
23 applications

ML Engineer
18 applications

[ + New Job ]
```

Chỉ show Job thuộc recruiter hiện tại.

---

## 29.3. Create Job — Step 1

```text
Create Job

① Job Description
② Evaluation
③ Publish

Upload Job Description

[ Drop PDF / DOCX / TXT here ]

[ Analyze JD ]
```

---

## 29.4. Create Job — Step 2: Evaluation Editor

```text
Evaluation Criteria

10 questions

[ + Add question ]

01 Minimum backend experience
   Required
   Noul

   Does `resume` demonstrate at least
   5 years of backend experience?

   [ Edit ] [ Delete ]

02 TypeScript proficiency
   Required
   Score

   0 No relevant experience
   1 Limited exposure
   2 Some professional usage
   3 Regular production usage
   4 Strong expertise
   5 Deep expertise

   [ Edit ] [ Delete ]

[ Continue ]
```

HR được:

- Add
- Edit
- Delete
- Change importance
- Change type
- Edit criteria

---

## 29.5. Create Job — Step 3: Publish

```text
Senior Backend Engineer

Evaluation Plan ready
11 questions

Required   6
Core       3
Preferred  2

[ Publish Job ]
```

---

## 29.6. Published Job Detail

```text
Senior Backend Engineer

Application Link
https://example.com/apply/k8Ws92Ax

[ Copy Link ]

Applications: 47

Candidate             Match
Nguyen Van A          91.2%
Tran Van B            87.4%
Le Van C              84.3%
Pham Van D            79.8%
```

Sort default:

```text
match_score DESC
```

---

## 29.7. Application Detail

```text
Nguyen Van A

Overall Match
86.4%

────────────────────────

minimum_backend_experience

96% true

Does the candidate demonstrate at least
5 years of backend engineering experience?

Noul

────────────────────────

typescript_proficiency

4.2 / 5
Confidence 95%

Rate the professional TypeScript proficiency
demonstrated by the resume.

Score
```

Expanded Score row:

```text
Raw result
4.2 / 5

Normalized
0.84

Importance
Required

Weight
3

Contribution
2.52
```

Button:

```text
[ View Original CV ]
```

---

# 30. UI Style

MVP visual direction:

- light background;
- white cards;
- neutral borders;
- one accent color;
- minimal dashboard;
- no unnecessary charts;
- compact typography;
- Score/Noul badge;
- accordion rows;
- no excessive status colors.

Focus:

> evaluation tool, not gamified recruiting.

---

# 31. Suggested Folder Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── sign-in/
│   │   └── page.tsx
│   │
│   ├── jobs/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [jobId]/
│   │       ├── page.tsx
│   │       └── applications/
│   │           └── [applicationId]/
│   │               └── page.tsx
│   │
│   ├── apply/
│   │   └── [slug]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── jobs/
│       └── applications/
│
├── components/
│   ├── job-upload.tsx
│   ├── evaluation-editor.tsx
│   ├── evaluation-row.tsx
│   ├── score-editor.tsx
│   ├── noul-editor.tsx
│   ├── candidate-table.tsx
│   ├── score-result.tsx
│   └── noul-result.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── files/
│   │   ├── extract-text.ts
│   │   ├── pdf.ts
│   │   └── docx.ts
│   │
│   ├── ai/
│   │   └── generate-evaluation.ts
│   │
│   ├── jev/
│   │   └── evaluate.ts
│   │
│   ├── scoring/
│   │   ├── normalize.ts
│   │   └── calculate-match.ts
│   │
│   └── auth/
│       └── require-user.ts
│
└── types/
    ├── job.ts
    ├── evaluation.ts
    └── application.ts
```

---

# 32. Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=

TYPESAFE_API_KEY=
TYPESAFE_DEFAULT_MODEL=jev-latest
```

`LLM_BASE_URL` là optional. Nếu để trống, application phải bỏ field `baseURL`
khi khởi tạo OpenAI client.

Không commit secrets.

---

# 33. Security Requirements

- Supabase RLS bắt buộc cho recruiter data.
- Recruiter chỉ truy cập Job của mình.
- Candidate CV bucket private.
- JD bucket private.
- Service role key server-only.
- `LLM_API_KEY` và `TYPESAFE_API_KEY` server-only.
- Public apply endpoint validate:
  - slug;
  - Job status;
  - file type;
  - file size;
  - required fields.
- Không expose:
  - Evaluation Plan trên public apply page;
  - Match Score cho candidate;
  - Application list;
  - resume text;
  - private Storage URL.
- Rate limiting public application endpoint là recommended.
- File scanning có thể thêm sau production.
- Không dùng candidate protected attributes để scoring.

---

# 34. Product Rules

## Rule 1

Evaluation Plan do LLM generate chỉ là draft.

HR quyết định final Evaluation Plan.

## Rule 2

Evaluation Plan chỉ edit khi:

```text
status === "draft"
```

## Rule 3

Sau publish:

```text
Evaluation Plan immutable
```

## Rule 4

Tất cả candidate của cùng Job dùng cùng một Evaluation Plan.

## Rule 5

Candidate không xem Match Score trong MVP.

## Rule 6

Không auto reject / auto hire.

## Rule 7

`Choice` không được sử dụng.

## Rule 8

Jev state chỉ chứa:

```ts
{
  resume: resumeText
}
```

## Rule 9

Weight do code quy định:

```text
required = 3
core = 2
preferred = 1
```

## Rule 10

Final Match được tính bằng deterministic TypeScript code.

---

# 35. Main Domain Model

```text
Supabase User
      │
      │ recruiter_id
      ▼
     Job
      │
      │ evaluation_plan
      │
      │ public_slug
      │
      └─────────────┐
                    │
                    ▼
               Application
                    │
                    ├── resume
                    ├── evaluations
                    └── match_score
```

---

# 36. Main Responsibility Separation

```text
LLM
"What should this Job evaluate?"
           │
           ▼
Evaluation Plan Draft


HR
"What should the final evaluation plan be?"
           │
           ▼
Approved Evaluation Plan


Jev
"How does this resume perform
against each evaluation question?"
           │
           ▼
Typed Judgments


TypeScript Scoring Engine
"How should these judgments
be combined?"
           │
           ▼
Match Score


Recruiter
"What hiring decision should be made?"
```

---

# 37. MVP Development Order

## Phase 1 — Core types and database

- create Supabase project;
- create `jobs`;
- create `applications`;
- setup Storage;
- setup RLS;
- add TypeScript domain types.

## Phase 2 — Auth

- Supabase Auth;
- sign-in page;
- protect `/jobs`;
- ownership tests.

## Phase 3 — Job creation

- upload JD;
- extract text;
- create draft Job.

## Phase 4 — LLM

- generate Evaluation Plan;
- validate output manually;
- save JSONB.

## Phase 5 — Evaluation Editor

- render questions;
- edit;
- add;
- delete;
- change importance;
- change Score/Noul;
- edit criteria.

## Phase 6 — Publish

- validate Plan;
- lock Plan;
- generate public slug;
- public apply route.

## Phase 7 — Candidate Application

- candidate form;
- CV upload;
- private storage;
- extract resume text.

## Phase 8 — Jev

- convert Plan → Jev questions;
- state = `{ resume }`;
- call Jev;
- save results.

## Phase 9 — Scoring

- normalize Score;
- normalize Noul;
- apply importance weights;
- calculate Match Score.

## Phase 10 — HR Dashboard

- Job list;
- application list;
- sort by Match Score;
- application detail;
- raw Jev UI;
- original CV signed URL.

---

# 38. Definition of Done — MVP

MVP được coi là hoàn thành khi:

1. HR có thể sign up/sign in.
2. HR A không thể xem Job của HR B.
3. HR upload được JD.
4. Hệ thống extract được JD text.
5. LLM generate Evaluation Plan.
6. HR có thể add/edit/delete question.
7. HR có thể đổi importance.
8. HR có thể đổi Score ↔ Noul.
9. HR có thể edit Score criteria.
10. HR publish được Job.
11. Evaluation Plan không sửa được sau publish.
12. Candidate mở được public link.
13. Candidate submit name/email/CV.
14. CV được lưu private.
15. Resume text được extract.
16. Jev evaluate bằng `state.resume`.
17. Score/Noul được normalize.
18. Match Score được tính deterministic.
19. HR thấy danh sách applications.
20. HR thấy application detail.
21. HR có thể mở original CV.
22. Candidate không thấy Match Score.
23. Không sử dụng `Choice`.
24. Không auto hire / auto reject.

---

# 39. Summary

Jev Match sử dụng mô hình:

```text
JD
 ↓
LLM
 ↓
Evaluation Plan Draft
 ↓
HR Review
 ↓
Final Evaluation Plan
 ↓
Publish Job
 ↓
Public Apply Link
 ↓
Candidate CV
 ↓
Jev
 ↓
Typed Evaluation Results
 ↓
Deterministic Weighted Scoring
 ↓
Match Score
 ↓
Recruiter Review
```

Triết lý cốt lõi:

> LLM quyết định nên đánh giá những gì.  
> HR quyết định Evaluation Plan cuối cùng.  
> Jev đánh giá CV theo từng criterion.  
> Code tính Match Score.  
> Recruiter đưa ra quyết định tuyển dụng.
