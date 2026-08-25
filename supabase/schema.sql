-- ============================================================
-- EduAdmin — Student Management System schema
-- Run this in Supabase Dashboard -> SQL Editor (once).
-- ============================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roll_number text not null,
  class_id uuid not null references public.classes(id) on delete cascade
);

-- one roll number per class
create unique index if not exists students_class_roll_idx
  on public.students (class_id, roll_number);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_term text not null,
  marks_obtained numeric not null check (marks_obtained >= 0),
  max_marks numeric not null check (max_marks > 0),
  check (marks_obtained <= max_marks)
);

create index if not exists marks_student_idx on public.marks (student_id);
create index if not exists marks_subject_idx on public.marks (subject_id);
create index if not exists students_class_idx on public.students (class_id);

-- one mark per student per subject per term (lets the app upsert edits)
create unique index if not exists marks_student_subject_term_idx
  on public.marks (student_id, subject_id, exam_term);

-- ============================================================
-- Row Level Security: every table locked; signed-in users only.
-- ============================================================

alter table public.classes  enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.marks    enable row level security;

drop policy if exists "authenticated full access classes"  on public.classes;
drop policy if exists "authenticated full access students" on public.students;
drop policy if exists "authenticated full access subjects" on public.subjects;
drop policy if exists "authenticated full access marks"    on public.marks;

create policy "authenticated full access classes"
  on public.classes for all to authenticated
  using (true) with check (true);

create policy "authenticated full access students"
  on public.students for all to authenticated
  using (true) with check (true);

create policy "authenticated full access subjects"
  on public.subjects for all to authenticated
  using (true) with check (true);

create policy "authenticated full access marks"
  on public.marks for all to authenticated
  using (true) with check (true);
