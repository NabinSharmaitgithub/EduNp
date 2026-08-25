import type { MarkRow, StudentRow, StudentStat, SubjectRow } from "@/lib/types";

/** Pure aggregation — shared by server pages and client components. */
export function computeStudentStats(
  students: StudentRow[],
  marks: MarkRow[],
  termFilter?: string | null,
): StudentStat[] {
  const filtered = termFilter ? marks.filter((m) => m.exam_term === termFilter) : marks;
  const map = new Map<string, StudentStat>();
  for (const s of students) {
    map.set(s.id, { student: s, bySubject: {}, total: 0, totalMax: 0, pct: null });
  }
  for (const m of filtered) {
    const stat = map.get(m.student_id);
    if (!stat) continue;
    const cur = stat.bySubject[m.subject_id] ?? { obtained: 0, max: 0 };
    cur.obtained += Number(m.marks_obtained);
    cur.max += Number(m.max_marks);
    stat.bySubject[m.subject_id] = cur;
    stat.total += Number(m.marks_obtained);
    stat.totalMax += Number(m.max_marks);
  }
  for (const stat of map.values()) {
    stat.pct = stat.totalMax > 0 ? (stat.total / stat.totalMax) * 100 : null;
  }
  return [...map.values()];
}

export interface ReportRow extends StudentStat {
  rank: number;
}

/** Ranked list: highest pct first; students without marks sink to the bottom. */
export function rankStudents(stats: StudentStat[]): ReportRow[] {
  const withMarks = stats.filter((s) => s.pct !== null).sort((a, b) => b.pct! - a.pct!);
  const without = stats.filter((s) => s.pct === null);
  return [...withMarks, ...without].map((s, i) => ({
    ...s,
    rank: s.pct === null ? 0 : i + 1,
  }));
}

export function subjectMap(subjects: SubjectRow[]): Record<string, string> {
  return Object.fromEntries(subjects.map((s) => [s.id, s.name]));
}
