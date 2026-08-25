import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportClient } from "@/components/report-client";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export default async function ClassReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const [cls, students, marks, subjects] = await Promise.all([
    sb.from("classes").select("*").eq("id", id).single(),
    sb.from("students").select("*").eq("class_id", id),
    sb.from("marks").select("id,student_id,subject_id,exam_term,marks_obtained,max_marks"),
    sb.from("subjects").select("*").order("name"),
  ]);
  if (cls.error || !cls.data) notFound();

  return (
    <ReportClient
      cls={cls.data as ClassRow}
      students={(students.data ?? []) as StudentRow[]}
      allMarks={(marks.data ?? []).filter((m: MarkRow) =>
        (students.data ?? []).some((s) => s.id === m.student_id),
      ) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  );
}
