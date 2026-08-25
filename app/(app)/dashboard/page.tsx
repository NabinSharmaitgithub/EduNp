import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export default async function DashboardPage() {
  const sb = await createClient();
  const [classes, students, marks, subjects] = await Promise.all([
    sb.from("classes").select("*").order("name"),
    sb.from("students").select("id,name,roll_number,class_id"),
    sb.from("marks").select("id,student_id,subject_id,exam_term,marks_obtained,max_marks"),
    sb.from("subjects").select("*").order("name"),
  ]);

  return (
    <DashboardClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      error={classes.error?.message ?? students.error?.message ?? marks.error?.message ?? subjects.error?.message}
    />
  );
}
