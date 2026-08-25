export interface ClassRow {
  id: string;
  name: string;
  section: string | null;
}

export interface StudentRow {
  id: string;
  name: string;
  roll_number: string;
  class_id: string;
}

export interface SubjectRow {
  id: string;
  name: string;
}

export interface MarkRow {
  id: string;
  student_id: string;
  subject_id: string;
  exam_term: string;
  marks_obtained: number;
  max_marks: number;
}

export interface StudentStat {
  student: StudentRow;
  bySubject: Record<string, { obtained: number; max: number }>;
  total: number;
  totalMax: number;
  pct: number | null; // null = no marks yet
}

export const EXAM_TERMS = ["Term 1", "Term 2", "Term 3", "Final Exam"] as const;

export function gradeOf(pct: number | null): { label: string; cls: string } {
  if (pct === null) return { label: "—", cls: "text-on-surface-variant bg-surface-container-high" };
  if (pct >= 80) return { label: pct >= 93 ? "A+" : pct >= 87 ? "A" : "A-", cls: "text-secondary bg-secondary-container/30" };
  if (pct >= 60) return { label: pct >= 73 ? "B+" : pct >= 67 ? "B" : "B-", cls: "text-primary bg-primary-fixed" };
  if (pct >= 40) return { label: pct >= 53 ? "C+" : pct >= 47 ? "C" : "C-", cls: "text-tertiary bg-tertiary-fixed/60" };
  return { label: "D", cls: "text-on-error-container bg-error-container" };
}

export function barColor(pct: number | null): string {
  if (pct === null) return "bg-outline-variant";
  if (pct >= 80) return "bg-secondary";
  if (pct >= 60) return "bg-primary-container";
  if (pct >= 40) return "bg-amber-500";
  return "bg-error";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
