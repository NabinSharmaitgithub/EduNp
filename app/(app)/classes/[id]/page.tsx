import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassView } from "@/components/class-view";
import { getUserRole, roleHome } from "@/app/actions";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const homeHref = await roleHome(await getUserRole());
  const [cls, students, marks, subjects] = await Promise.all([
    sb.from("classes").select("*").eq("id", id).single(),
    sb.from("students").select("*").eq("class_id", id).order("roll_number"),
    sb.from("marks").select("id,student_id,subject_id,exam_term,marks_obtained,max_marks"),
    sb.from("subjects").select("*").order("name"),
  ]);
  if (cls.error || !cls.data) notFound();

  return (
    <ClassView
      cls={cls.data as ClassRow}
      students={(students.data ?? []) as StudentRow[]}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      homeHref={homeHref}
    />
  );
}
