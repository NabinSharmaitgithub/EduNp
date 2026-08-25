"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return supabase;
}

/* ---------- classes ---------- */

export async function saveClass(input: {
  id?: string;
  name: string;
  section: string;
}): Promise<Result> {
  const sb = await requireClient();
  const values = { name: input.name.trim(), section: input.section.trim() || null };
  const { error } = input.id
    ? await sb.from("classes").update(values).eq("id", input.id)
    : await sb.from("classes").insert(values);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  if (input.id) revalidatePath(`/classes/${input.id}`);
  revalidatePath("/classes/[id]/report", "page");
  return {};
}

export async function deleteClass(id: string): Promise<Result> {
  const sb = await requireClient();
  const { error } = await sb.from("classes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

/* ---------- students ---------- */

export async function saveStudent(input: {
  id?: string;
  class_id: string;
  name: string;
  roll_number: string;
}): Promise<Result> {
  const sb = await requireClient();
  const values = { name: input.name.trim(), roll_number: input.roll_number.trim() };
  const { error } = input.id
    ? await sb.from("students").update(values).eq("id", input.id)
    : await sb.from("students").insert({ ...values, class_id: input.class_id });
  if (error) return { error: error.code === "23505" ? "That roll number is already taken in this class." : error.message };
  revalidatePath(`/classes/${input.class_id}`);
  revalidatePath("/dashboard");
  if (input.id) revalidatePath(`/students/${input.id}`);
  return {};
}

export async function deleteStudent(id: string, classId: string): Promise<Result> {
  const sb = await requireClient();
  const { error } = await sb.from("students").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/classes/${classId}`);
  revalidatePath("/dashboard");
  return {};
}

/* ---------- subjects ---------- */

export async function saveSubject(name: string): Promise<Result & { id?: string }> {
  const sb = await requireClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Subject name is required." };
  const { data, error } = await sb
    .from("subjects")
    .upsert({ name: trimmed }, { onConflict: "name" })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/students/[id]", "page");
  return { id: data.id };
}

export async function deleteSubject(id: string): Promise<Result> {
  const sb = await requireClient();
  const { error } = await sb.from("subjects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/students/[id]", "page");
  return {};
}

/* ---------- marks ---------- */

export async function saveMark(input: {
  student_id: string;
  subject_id: string;
  exam_term: string;
  marks_obtained: number;
  max_marks: number;
}): Promise<Result> {
  const sb = await requireClient();
  const { data: student } = await sb.from("students").select("class_id").eq("id", input.student_id).single();
  const { error } = await sb.from("marks").upsert(input, {
    onConflict: "student_id,subject_id,exam_term",
  });
  if (error) return { error: error.message };
  revalidatePath(`/students/${input.student_id}`);
  if (student?.class_id) {
    revalidatePath(`/classes/${student.class_id}`);
    revalidatePath(`/classes/${student.class_id}/report`);
  }
  revalidatePath("/dashboard");
  return {};
}

export async function updateMarkValue(
  markId: string,
  marks_obtained: number,
  studentId: string,
  classId: string,
): Promise<Result> {
  const sb = await requireClient();
  const { error } = await sb.from("marks").update({ marks_obtained }).eq("id", markId);
  if (error) return { error: error.message };
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes/${classId}/report`);
  revalidatePath("/dashboard");
  return {};
}

export async function deleteMark(markId: string, studentId: string, classId: string): Promise<Result> {
  const sb = await requireClient();
  const { error } = await sb.from("marks").delete().eq("id", markId);
  if (error) return { error: error.message };
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/classes/${classId}`);
  revalidatePath(`/classes/${classId}/report`);
  revalidatePath("/dashboard");
  return {};
}
