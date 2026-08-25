# EduAdmin — Student Management System

Full-stack student management app built from Google Stitch UI designs.
Next.js (App Router) · Supabase (Postgres + Auth) · Tailwind CSS v4 · Vercel-ready.

## Features

- **Auth** — email/password login & signup via Supabase Auth
- **Dashboard** — class cards with live student counts and average grades, search, create/edit/delete classes
- **Subjects** — create/delete subjects from the dashboard
- **Class view** — searchable/sortable student table, add/edit/remove students (modal), row click → profile
- **Student profile** — add/edit marks per subject per exam term (inline editing, upsert-safe)
- **Report card** — per-student totals, percentage, pass/fail, term filter, print-friendly
- **Class report** — ranked table (🥇🥈🥉), sortable columns, color-coded performance bars, CSV export, print

UX: inline form validation, modals (no page reloads), toast notifications, loading skeletons,
optimistic updates on deletes/edits.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the `classes`, `students`, `subjects`, `marks` tables (with constraints +
   a unique index enabling mark upserts) and enables **RLS scoped to authenticated users**.
3. *(Optional)* To avoid confirmation emails during development:
   **Authentication → Providers → Email** → disable "Confirm email".
4. Grab your keys from **Project Settings → API**.

> RLS note: any authenticated user can read/write all rows (a shared staff workspace).
> To isolate teachers per-account later, add a `user_id` column + owner-scoped policies.

## 2. Environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Both are public (anon) keys — safe for the browser; RLS is your security boundary.

## 3. Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Sign up at `/login`, then start creating classes → students → subjects → marks.

## 4. Deploy to Vercel

1. Push this repo to GitHub:

   ```bash
   git remote add origin git@github.com:YOU/YOUR_REPO.git
   git push -u origin main
   ```

2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
   Framework preset is auto-detected (Next.js). Add the two `NEXT_PUBLIC_*` env vars,
   then **Deploy**.

The Stitch reference designs live in [`designs/`](designs) for comparison.

## Project structure

```
app/
  login/page.tsx              # auth screen (split brand panel + tabs)
  (app)/layout.tsx            # authenticated shell (sidebar + session guard)
  (app)/dashboard/page.tsx    # KPIs, class grid, subjects manager
  (app)/classes/[id]/page.tsx # students table
  (app)/students/[id]/page.tsx# marks + report card tabs
  (app)/classes/[id]/report/  # ranked performance summary
  actions.ts                  # server actions — all CRUD
components/                   # interactive clients (modals, tables, toasts…)
lib/
  supabase/{client,server}.ts # lazy browser/server Supabase clients
  stats.ts                    # pure aggregation (averages, ranks)
  types.ts                    # row types + grade/color helpers
supabase/schema.sql           # run once in SQL Editor
middleware.ts                 # session refresh + route protection
```
