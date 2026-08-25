import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentView } from "@/components/student-view";
import type { MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const [student, marks, subjects] = await Promise.all([
    sb.from("students").select("id,name,roll_number,class_id").eq("id", id).single(),
    sb.from("marks").select("id,student_id,subject_id,exam_term,marks_obtained,max_marks").eq("student_id", id),
    sb.from("subjects").select("*").order("name"),
  ]);
  if (student.error || !student.data) notFound();

  let cls: { id: string; name: string; section: string | null } | null = null;
  if (student.data.class_id) {
    const { data } = await sb.from("classes").select("id,name,section").eq("id", student.data.class_id).single();
    cls = data;
  }

  return (
    <StudentView
      student={student.data as StudentRow}
      cls={cls}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  );
}
