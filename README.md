# EduNp — School Management System

Full-stack multi-role school management app. Next.js 15 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS v4 · Vercel.

## Roles

| Role | Access |
|------|--------|
| **Principal** | Full admin: analytics, staff, classes, attendance, timetable, fees, announcements, exams, leave, audit log, CSV import |
| **Teacher** | Assigned classes/subjects only: attendance, marks, timetable, leave requests |
| **Parent** | Read-only: child's marks, attendance, fees |

First user to sign up becomes principal. Subsequent users auto-link to staff or parent records by email match on first login.

## Features

### Principal (Admin)
- **Analytics dashboard** — KPI cards, class performance chart, grade distribution, fee collection, attendance trend (Recharts)
- **Staff & Parents** — CRUD for teachers, parents; link accounts by email
- **Assignments** — assign class teachers and subject teachers
- **Attendance** — bulk daily attendance marking per class
- **Timetable** — schedule classes by day/period with teacher and subject
- **Fees** — fee structure per class, record payments, track outstanding
- **Announcements** — post and manage school-wide announcements
- **Exams** — create exams, assign invigilators
- **Leave** — approve/reject staff leave requests
- **Audit Log** — filterable log of all write operations
- **CSV Import** — bulk import students and marks via PapaParse

### Teacher
- **Dashboard** — assigned classes with student stats and subject performance
- **Attendance** — mark attendance for assigned classes
- **Marks** — enter marks per subject/exam term
- **Timetable** — view own schedule
- **Leave** — submit and cancel leave requests

### Parent
- **Dashboard** — child's marks, attendance summary, fee status

### Core
- Class and student CRUD with search/sort
- Report cards with term filtering
- Ranked class reports with CSV export and print
- Mark upsert (idempotent per student/subject/term)
- Fee status auto-computed via PostgreSQL trigger
- Audit logging on every write action
- RLS with role-based policies (principal full, teacher scoped, parent read-only child)
- Toast notifications, optimistic updates, loading skeletons

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run the migrations in order:
   - `supabase/schema.sql` — base tables (classes, students, subjects, marks)
   - RLS policies and helper functions (see deployment notes)
3. *(Optional)* Disable email confirmation: **Authentication → Providers → Email** → uncheck "Confirm email".
4. Grab keys from **Project Settings → API**.

## 2. Environment variables

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 3. Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Sign up at `/login` — first user becomes principal automatically.

## 4. Deploy to Vercel

1. Push to GitHub
2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
4. **Deploy** — Vercel auto-detects Next.js

## Project structure

```
app/
  login/page.tsx                   # auth screen
  (app)/layout.tsx                 # authenticated shell (role-aware sidebar)
  (app)/dashboard/page.tsx         # original dashboard (class grid, subjects)
  (app)/admin/page.tsx             # principal analytics (Recharts)
  (app)/admin/staff/               # staff & parent management
  (app)/admin/assignments/         # class/subject teacher assignments
  (app)/admin/attendance/          # bulk attendance marking
  (app)/admin/timetable/           # timetable CRUD
  (app)/admin/fees/                # fee management
  (app)/admin/announcements/       # announcements
  (app)/admin/exams/               # exam management + duty assignment
  (app)/admin/leave/               # leave approval
  (app)/admin/audit-log/           # audit log viewer
  (app)/admin/import/              # CSV import (students/marks)
  (app)/teacher/page.tsx           # teacher dashboard
  (app)/teacher/attendance/        # attendance for assigned classes
  (app)/teacher/marks/             # mark entry
  (app)/teacher/timetable/         # own timetable
  (app)/teacher/leave/             # leave requests
  (app)/parent/page.tsx            # parent dashboard (read-only)
  (app)/classes/[id]/              # class student list
  (app)/classes/[id]/report/       # ranked class report
  (app)/students/[id]/             # student profile + marks
  actions.ts                       # core CRUD server actions
  admin/actions.ts                 # admin server actions
  teacher/actions.ts               # teacher server actions
components/
  ui.tsx                           # Modal, Field, GradePill, Progress, Avatar, etc.
  shell.tsx                        # role-aware sidebar navigation
  toast.tsx                        # toast provider
  icon.tsx                         # Material Symbols wrapper
  admin/                           # admin client components
  teacher/                         # teacher client components
  parent/                          # parent client components
lib/
  supabase/{client,server}.ts      # browser/server Supabase clients
  types.ts                         # row types, constants, grade/color helpers
  stats.ts                         # mark aggregation and ranking
  role.ts                          # getUserProfile, logAuditEvent
supabase/schema.sql                # base table DDL
middleware.ts                      # session refresh + route protection
```
