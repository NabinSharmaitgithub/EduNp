'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/role'

export async function saveClass(values: { name: string; section: string; id?: string }) {
  const supabase = await createClient()
  if (values.id) {
    const { error } = await supabase.from('classes').update({ name: values.name, section: values.section }).eq('id', values.id)
    if (error) return { error: error.message }
    await logAuditEvent('update', 'classes', values.id, values)
  } else {
    const { data, error } = await supabase.from('classes').insert({ name: values.name, section: values.section }).select().single()
    if (error) return { error: error.message }
    await logAuditEvent('create', 'classes', data.id, values)
  }
  revalidatePath('/dashboard'); revalidatePath('/classes')
  return {}
}

export async function deleteClass(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'classes', id)
  revalidatePath('/dashboard'); revalidatePath('/classes')
  return {}
}

export async function saveStudent(values: { name: string; roll_number: string; class_id: string; parent_id?: string; id?: string }) {
  const supabase = await createClient()
  if (values.id) {
    const { error } = await supabase.from('students').update({ name: values.name, roll_number: values.roll_number, parent_id: values.parent_id || null }).eq('id', values.id)
    if (error) return { error: error.message }
    await logAuditEvent('update', 'students', values.id, values)
  } else {
    const { data, error } = await supabase.from('students').insert({ name: values.name, roll_number: values.roll_number, class_id: values.class_id, parent_id: values.parent_id || null }).select().single()
    if (error) return { error: error.message }
    await logAuditEvent('create', 'students', data.id, values)
  }
  revalidatePath('/classes'); revalidatePath(`/classes/${values.class_id}`)
  return {}
}

export async function deleteStudent(id: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'students', id)
  revalidatePath(`/classes/${classId}`)
  return {}
}

export async function saveSubject(values: { name: string; id?: string }) {
  const supabase = await createClient()
  if (values.id) {
    const { error } = await supabase.from('subjects').update({ name: values.name }).eq('id', values.id)
    if (error) return { error: error.message }
    await logAuditEvent('update', 'subjects', values.id, values)
  } else {
    const { data, error } = await supabase.from('subjects').insert({ name: values.name }).select().single()
    if (error) return { error: error.message }
    await logAuditEvent('create', 'subjects', data.id, values)
  }
  revalidatePath('/dashboard')
  return {}
}

export async function deleteSubject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'subjects', id)
  revalidatePath('/dashboard')
  return {}
}

export async function saveMark(values: { student_id: string; subject_id: string; exam_term: string; marks_obtained: number; max_marks: number }) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('marks').select('id').eq('student_id', values.student_id).eq('subject_id', values.subject_id).eq('exam_term', values.exam_term).single()
  if (existing) {
    const { error } = await supabase.from('marks').update({ marks_obtained: values.marks_obtained, max_marks: values.max_marks }).eq('id', existing.id)
    if (error) return { error: error.message }
    await logAuditEvent('update', 'marks', existing.id, values)
  } else {
    const { data, error } = await supabase.from('marks').insert(values).select().single()
    if (error) return { error: error.message }
    await logAuditEvent('create', 'marks', data.id, values)
  }
  revalidatePath('/students')
  return {}
}

export async function updateMarkValue(id: string, marks_obtained: number, studentId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marks').update({ marks_obtained }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'marks', id, { marks_obtained })
  revalidatePath(`/students/${studentId}`)
  if (classId) revalidatePath(`/classes/${classId}/report`)
  return {}
}

export async function deleteMark(id: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marks').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'marks', id)
  revalidatePath(`/students/${studentId}`)
  return {}
}
