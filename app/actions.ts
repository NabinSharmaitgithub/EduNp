'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/role'

export async function saveClass(values: { name: string; section: string; id?: string }) {
  const name = values.name.trim()
  const section = values.section.trim()
  if (!name) return { error: 'Class name is required' }
  const supabase = await createClient()
  if (values.id) {
    const { data: dups } = await supabase.from('classes').select('id, section').eq('name', name)
    if (dups?.find(r => (r.section ?? '') === section && r.id !== values.id))
      return { error: 'A class with this name and section already exists.' }
    const { error } = await supabase.from('classes').update({ name, section }).eq('id', values.id)
    if (error) return { error: error.message.includes('duplicate') ? 'A class with this name and section already exists.' : error.message }
    await logAuditEvent('update', 'classes', values.id, { name, section })
  } else {
    const { data: dups } = await supabase.from('classes').select('id, section').eq('name', name)
    if (dups?.some(r => (r.section ?? '') === section))
      return { error: 'A class with this name and section already exists.' }
    const { data, error } = await supabase.from('classes').insert({ name, section }).select().single()
    if (error) return { error: error.message.includes('duplicate') ? 'A class with this name and section already exists.' : error.message }
    await logAuditEvent('create', 'classes', data.id, { name, section })
  }
  revalidatePath('/admin'); revalidatePath('/admin/classes'); revalidatePath('/principal/classes'); revalidatePath('/classes'); revalidatePath('/principal')
  return {}
}

export async function deleteClass(id: string) {
  const role = await getUserRole()
  if (role !== 'admin' && role !== 'principal')
    return { error: 'Only an admin or principal can remove classes' }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('classes')
    .select(`id, name, section,
      students:students(count),
      attendance:attendance(count),
      exams:exams(count),
      announcements:announcements(count),
      exam_duties:exam_duties(count)`)
    .eq('id', id)
    .single()
  if (error) return { error: error.message }
  const label = `${data.name}${data.section ? ' / ' + data.section : ''}`
  const counts = {
    students: data.students?.[0]?.count ?? 0,
    attendance: data.attendance?.[0]?.count ?? 0,
    exams: data.exams?.[0]?.count ?? 0,
    announcements: data.announcements?.[0]?.count ?? 0,
    exam_duties: data.exam_duties?.[0]?.count ?? 0,
  }
  if (counts.students > 0)
    return { error: `Cannot remove class "${label}": ${counts.students} student${counts.students === 1 ? '' : 's'} still assigned. Move or remove them first.` }
  const historyCount = counts.attendance + counts.exams + counts.announcements + counts.exam_duties
  if (historyCount > 0)
    return { error: `Cannot remove class "${label}": it has ${historyCount} attendance, exam, or announcement record${historyCount === 1 ? '' : 's'} that must be preserved.` }

  await supabase.from('teacher_class_assignments').delete().eq('class_id', id)
  await supabase.from('teacher_subject_assignments').delete().eq('class_id', id)
  await supabase.from('timetable').delete().eq('class_id', id)

  const { error: delErr } = await supabase.from('classes').delete().eq('id', id)
  if (delErr) return { error: delErr.message }
  await logAuditEvent('remove_class', 'classes', id, { name: data.name, section: data.section })
  revalidatePath('/admin'); revalidatePath('/admin/classes'); revalidatePath('/admin/assignments'); revalidatePath('/admin/timetable')
  revalidatePath('/principal/classes'); revalidatePath('/principal/assignments'); revalidatePath('/principal/timetable'); revalidatePath('/principal')
  revalidatePath('/classes')
  return {}
}

export type StudentInput = {
  name: string; roll_number: string; class_id?: string; parent_id?: string; id?: string
  date_of_birth?: string; gender?: string
  father_name?: string; father_occupation?: string
  mother_name?: string; mother_occupation?: string
  guardian_contact_number?: string; emergency_contact_number?: string
  student_address?: string; iems_number?: string
  admission_date?: string; blood_group?: string; photo_url?: string
}

export async function saveStudent(values: StudentInput) {
  const supabase = await createClient()

  if (values.iems_number) {
    const { data: existingIems } = await supabase
      .from('students').select('id').eq('iems_number', values.iems_number).single()
    if (existingIems && existingIems.id !== values.id) {
      return { error: 'A student with this IEMS Number already exists.' }
    }
  }

  const row = {
    name: values.name, roll_number: values.roll_number, parent_id: values.parent_id || null,
    date_of_birth: values.date_of_birth || null, gender: values.gender || null,
    father_name: values.father_name || null, father_occupation: values.father_occupation || null,
    mother_name: values.mother_name || null, mother_occupation: values.mother_occupation || null,
    guardian_contact_number: values.guardian_contact_number || null,
    emergency_contact_number: values.emergency_contact_number || null,
    student_address: values.student_address || null, iems_number: values.iems_number || null,
    admission_date: values.admission_date || null, blood_group: values.blood_group || null,
    photo_url: values.photo_url || null,
  }

  if (values.id) {
    const { error } = await supabase.from('students').update(row).eq('id', values.id)
    if (error) return { error: error.message }
    await logAuditEvent('update', 'students', values.id, values)
  } else {
    const { data, error } = await supabase.from('students').insert({ ...row, class_id: values.class_id }).select().single()
    if (error) return { error: error.message }
    await logAuditEvent('create', 'students', data.id, values)
  }
  revalidatePath('/classes'); revalidatePath(`/classes/${values.class_id}`); revalidatePath('/admin/classes'); revalidatePath('/principal/classes'); revalidatePath('/principal')
  return {}
}

export async function deleteStudent(id: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'students', id)
  revalidatePath(`/classes/${classId}`); revalidatePath('/admin/classes'); revalidatePath('/principal/classes'); revalidatePath('/principal')
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
  revalidatePath('/admin')
  revalidatePath('/principal'); revalidatePath('/principal/classes'); revalidatePath('/principal/timetable')
  return {}
}

export async function deleteSubject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'subjects', id)
  revalidatePath('/admin')
  revalidatePath('/principal'); revalidatePath('/principal/classes'); revalidatePath('/principal/timetable')
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
  revalidatePath('/students'); revalidatePath('/principal')
  return {}
}

export async function updateMarkValue(id: string, marks_obtained: number, studentId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marks').update({ marks_obtained }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'marks', id, { marks_obtained })
  revalidatePath(`/students/${studentId}`)
  if (classId) revalidatePath(`/classes/${classId}/report`)
  revalidatePath('/principal')
  return {}
}

export async function deleteMark(id: string, studentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('marks').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'marks', id)
  revalidatePath(`/students/${studentId}`); revalidatePath('/principal')
  return {}
}

const ROLE_HOME: Record<string, string> = {
  admin: '/admin', principal: '/principal', teacher: '/teacher',
  helping_staff: '/helping-staff', parent: '/parent',
}

export async function getUserRole(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase
    .from('staff').select('role').eq('user_id', user.id).eq('status', 'active').single()
  return staff?.role ?? null
}

export async function roleHome(role: string | null): Promise<string> {
  return ROLE_HOME[role || ''] || '/login'
}

export async function completePasswordChange() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: staff, error: fetchErr } = await supabase
    .from('staff').select('role').eq('user_id', user.id).eq('status', 'active').single()
  if (fetchErr || !staff) return { error: 'Staff profile not found' }

  const { error } = await supabase.from('staff').update({ must_change_password: false }).eq('user_id', user.id)
  if (error) {
    console.error('Failed to clear must_change_password:', error.message)
    // Still return role so the user isn't stuck
  }

  return { role: staff.role }
}
