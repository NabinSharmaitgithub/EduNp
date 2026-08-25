'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { logAuditEvent, getCurrentStaffId } from '@/lib/role'
import type { StaffRole } from '@/lib/types'

const VALID_ROLES: StaffRole[] = ['teacher', 'admin', 'principal', 'helping_staff']
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CreateStaffInput = {
  name: string; email: string; role: StaffRole
  date_of_birth?: string; gender?: string; contact_number?: string
  emergency_contact_number?: string; address?: string; qualification?: string
  designation?: string; subject_specialization?: string; date_of_joining?: string
  teacher_class_id?: string
  teacher_subjects?: { subject_id: string; class_id: string }[]
}

export async function createStaff(input: CreateStaffInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Validate
  const errs: string[] = []
  if (!input.name.trim()) errs.push('Name is required')
  if (!input.email.trim() || !emailRe.test(input.email)) errs.push('Valid email is required')
  if (!VALID_ROLES.includes(input.role)) errs.push('Invalid role')
  if (input.contact_number && !/^\d{7,15}$/.test(input.contact_number)) errs.push('Contact number must be 7-15 digits')
  if (input.emergency_contact_number && !/^\d{7,15}$/.test(input.emergency_contact_number)) errs.push('Emergency contact must be 7-15 digits')
  if (errs.length) return { error: errs.join('; ') }

  // Check email uniqueness in staff
  const { data: existing } = await supabase.from('staff').select('id').eq('email', input.email.trim()).limit(1)
  if (existing && existing.length > 0) return { error: 'A staff member with this email already exists' }

  // Create Supabase Auth user
  const tempPassword = generateTempPassword(12)
  const admin = createAdminClient()
  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: input.email.trim(),
    password: tempPassword,
    email_confirm: true,
  })
  if (authErr) return { error: `Auth user creation failed: ${authErr.message}` }

  // Insert staff row
  const staffRow: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    status: 'active',
    user_id: authUser.user.id,
    must_change_password: true,
    date_of_birth: input.date_of_birth || null,
    gender: input.gender || null,
    contact_number: input.contact_number || null,
    emergency_contact_number: input.emergency_contact_number || null,
    address: input.address || null,
    qualification: input.qualification || null,
    designation: input.designation || null,
    subject_specialization: input.subject_specialization || null,
    date_of_joining: input.date_of_joining || null,
  }

  const { data: staff, error: staffErr } = await supabase.from('staff').insert(staffRow).select().single()
  if (staffErr) {
    // Rollback: delete the auth user we just created
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: staffErr.message }
  }

  // If teacher, assign class teacher + subjects
  if (input.role === 'teacher') {
    if (input.teacher_class_id) {
      await supabase.from('teacher_class_assignments').upsert({ teacher_id: staff.id, class_id: input.teacher_class_id })
    }
    if (input.teacher_subjects?.length) {
      const rows = input.teacher_subjects.map(s => ({ teacher_id: staff.id, subject_id: s.subject_id, class_id: s.class_id }))
      await supabase.from('teacher_subject_assignments').insert(rows)
    }
  }

  await logAuditEvent('create', 'staff', staff.id, { name: staff.name, email: staff.email, role: staff.role })
  revalidatePath('/admin/staff')
  revalidatePath('/admin/assignments')
  return { data: staff, tempPassword }
}

export async function updateStaff(id: string, values: {
  name?: string; email?: string; role?: StaffRole; status?: string
  date_of_birth?: string; gender?: string; contact_number?: string
  emergency_contact_number?: string; address?: string; qualification?: string
  designation?: string; subject_specialization?: string; date_of_joining?: string
}) {
  const supabase = await createClient()

  if (values.contact_number && !/^\d{7,15}$/.test(values.contact_number)) return { error: 'Contact number must be 7-15 digits' }
  if (values.emergency_contact_number && !/^\d{7,15}$/.test(values.emergency_contact_number)) return { error: 'Emergency contact must be 7-15 digits' }
  if (values.email && !emailRe.test(values.email)) return { error: 'Invalid email format' }

  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) { if (v !== undefined) clean[k] = v || null }

  const { error } = await supabase.from('staff').update(clean).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'staff', id, clean)
  revalidatePath('/admin/staff')
  return {}
}

export async function deactivateStaff(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('staff').update({ status: 'removed' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('deactivate', 'staff', id)
  revalidatePath('/admin/staff')
  return {}
}

export async function assignClassTeacher(teacherId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_class_assignments').upsert({ teacher_id: teacherId, class_id: classId })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'teacher_class_assignments', undefined, { teacherId, classId })
  revalidatePath('/admin/assignments')
  return {}
}

export async function removeClassTeacher(classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_class_assignments').delete().eq('class_id', classId)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'teacher_class_assignments', undefined, { classId })
  revalidatePath('/admin/assignments')
  return {}
}

export async function assignSubjectTeacher(teacherId: string, subjectId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_subject_assignments').insert({ teacher_id: teacherId, subject_id: subjectId, class_id: classId })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'teacher_subject_assignments', undefined, { teacherId, subjectId, classId })
  revalidatePath('/admin/assignments')
  return {}
}

export async function removeSubjectTeacher(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_subject_assignments').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'teacher_subject_assignments', id)
  revalidatePath('/admin/assignments')
  return {}
}

export async function updateTeacherAssignments(teacherId: string, classId: string | null, subjects: { subject_id: string; class_id: string }[]): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Replace class teacher
  await supabase.from('teacher_class_assignments').delete().eq('teacher_id', teacherId)
  if (classId) {
    await supabase.from('teacher_class_assignments').insert({ teacher_id: teacherId, class_id: classId })
  }

  // Replace subject assignments
  await supabase.from('teacher_subject_assignments').delete().eq('teacher_id', teacherId)
  if (subjects.length) {
    const rows = subjects.map(s => ({ teacher_id: teacherId, subject_id: s.subject_id, class_id: s.class_id }))
    await supabase.from('teacher_subject_assignments').insert(rows)
  }

  await logAuditEvent('update', 'teacher_assignments', teacherId, { classId, subjectCount: subjects.length })
  revalidatePath('/admin/assignments')
  revalidatePath(`/admin/staff/${teacherId}`)
  return {}
}

export async function bulkMarkAttendance(classId: string, date: string, records: { student_id: string; status: string }[]) {
  const supabase = await createClient()
  const rows = records.map(r => ({ student_id: r.student_id, class_id: classId, date, status: r.status }))
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
  if (error) return { error: error.message }
  revalidatePath('/admin/attendance')
  return {}
}

export async function createTimetableEntry(values: { class_id: string; subject_id: string; teacher_id: string; day_of_week: string; period_number: number; start_time: string; end_time: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('timetable').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'timetable', data.id, values)
  revalidatePath('/admin/timetable')
  return { data }
}

export async function deleteTimetableEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('timetable').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'timetable', id)
  revalidatePath('/admin/timetable')
  return {}
}

export async function createFee(values: { student_id: string; amount_due: number; due_date: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('fees').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'fees', data.id, values)
  revalidatePath('/admin/fees')
  return { data }
}

export async function updateFeePayment(id: string, amountPaid: number, receiptNumber?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fees').update({ amount_paid: amountPaid, receipt_number: receiptNumber || null }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'fees', id, { amountPaid, receiptNumber })
  revalidatePath('/admin/fees')
  return {}
}

export async function createAnnouncement(values: { title: string; body: string; target: string; class_id?: string }) {
  const supabase = await createClient()
  const actorId = await getCurrentStaffId()
  if (!actorId) return { error: 'Not authorized' }
  const { data, error } = await supabase.from('announcements').insert({ ...values, created_by: actorId }).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'announcements', data.id, values)
  revalidatePath('/admin/announcements')
  return { data }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'announcements', id)
  revalidatePath('/admin/announcements')
  return {}
}

export async function createExam(values: { name: string; class_id: string; start_date: string; end_date: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('exams').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'exams', data.id, values)
  revalidatePath('/admin/exams')
  return { data }
}

export async function deleteExam(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'exams', id)
  revalidatePath('/admin/exams')
  return {}
}

export async function assignExamDuty(examId: string, teacherId: string, classId: string, role: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exam_duties').insert({ exam_id: examId, teacher_id: teacherId, class_id: classId, role })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'exam_duties', undefined, { examId, teacherId, classId, role })
  revalidatePath('/admin/exams')
  return {}
}

export async function removeExamDuty(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exam_duties').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'exam_duties', id)
  revalidatePath('/admin/exams')
  return {}
}

export async function approveLeaveRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leave_requests').update({ status: 'approved' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('approve', 'leave_requests', id)
  revalidatePath('/admin/leave')
  return {}
}

export async function rejectLeaveRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('reject', 'leave_requests', id)
  revalidatePath('/admin/leave')
  return {}
}

export async function createParent(values: { name: string; email: string; phone?: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('parents').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'parents', data.id, values)
  revalidatePath('/admin/staff')
  return { data }
}
