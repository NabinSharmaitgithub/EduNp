'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTempPassword } from '@/lib/supabase/admin'
import { logAuditEvent, getCurrentStaffId, getUserRole } from '@/lib/role'
import type { StaffRole } from '@/lib/types'

const VALID_ROLES: StaffRole[] = ['teacher', 'admin', 'principal', 'helping_staff']
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type CreateStaffInput = {
  name: string; email: string; role: StaffRole
  date_of_birth?: string; gender?: string; contact_number?: string
  emergency_contact_number?: string; address?: string; qualification?: string
  designation?: string; subject_specialization?: string; date_of_joining?: string
  photo_url?: string
  teacher_class_id?: string
  teacher_subjects?: { subject_id: string; class_id: string }[]
}

export async function createStaff(input: CreateStaffInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const errs: string[] = []
  if (!input.name.trim()) errs.push('Name is required')
  if (!input.email.trim() || !emailRe.test(input.email)) errs.push('Valid email is required')
  if (!VALID_ROLES.includes(input.role)) errs.push('Invalid role')
  if (input.contact_number && !/^\d{7,15}$/.test(input.contact_number)) errs.push('Contact number must be 7-15 digits')
  if (input.emergency_contact_number && !/^\d{7,15}$/.test(input.emergency_contact_number)) errs.push('Emergency contact must be 7-15 digits')

  if (input.role === 'admin' || input.role === 'principal') {
    const callerRole = await getUserRole()
    if (callerRole !== 'admin') errs.push('Only an admin can create staff with the ' + input.role + ' role')
  }

  if (errs.length) return { error: errs.join('; ') }

  const email = input.email.trim().toLowerCase()

  // 1) Check staff table for duplicate email
  const { data: existingStaff } = await supabase.from('staff').select('id, status').eq('email', email).limit(1)
  if (existingStaff && existingStaff.length > 0) {
    return { error: existingStaff[0].status === 'removed'
      ? 'A deactivated staff member with this email exists. Reactivate them instead.'
      : 'Staff with this email already exists.' }
  }

  const admin = createAdminClient()
  const tempPassword = generateTempPassword(12)
  let authUserId: string | null = null
  let authUserWasOurs = false

  // 2) Check if an auth user already exists for this email (orphaned from a prior failed attempt)
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const listRes = await fetch(`${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  const listData = await listRes.json()
  const existingAuthUser = listData?.users?.[0]

  if (existingAuthUser) {
    // Auth user exists but no staff row → orphan. Reuse it.
    authUserId = existingAuthUser.id
    authUserWasOurs = false
  } else {
    // Create fresh auth user
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })
    if (authErr) return { error: authErr.message.includes('already been registered')
      ? 'An account with this email already exists in the system.'
      : `Could not create login account: ${authErr.message}` }
    authUserId = authUser!.user.id
    authUserWasOurs = true
  }

  // 3) Insert staff row — rollback auth user on failure
  const staffRow: Record<string, unknown> = {
    name: input.name.trim(),
    email,
    role: input.role,
    status: 'active',
    user_id: authUserId,
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
    photo_url: input.photo_url || null,
  }

  const { data: staff, error: staffErr } = await supabase.from('staff').insert(staffRow).select().single()
  if (staffErr) {
    // Rollback: delete only the auth user we just created, not orphaned ones
    if (authUserWasOurs && authUserId) {
      await admin.auth.admin.deleteUser(authUserId)
    }
    return { error: staffErr.message.includes('duplicate')
      ? 'Staff with this email already exists.'
      : `Could not create staff record: ${staffErr.message}` }
  }

  // 4) Assignments for teachers
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
  revalidatePath('/principal/staff'); revalidatePath('/principal/assignments'); revalidatePath('/principal/performance'); revalidatePath('/principal')
  return { data: staff, temporaryPassword: tempPassword }
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

  // Only admin can change role to/from admin or principal; only admin can edit admin/principal rows
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') {
    if (values.role === 'admin' || values.role === 'principal')
      return { error: 'Only an admin can change a staff member\'s role to ' + (values.role) }
    const { data: target } = await supabase.from('staff').select('role').eq('id', id).single()
    if (target?.role === 'admin' || target?.role === 'principal')
      return { error: 'Only an admin can modify a ' + target!.role + ' staff member' }
  }

  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) { if (v !== undefined) clean[k] = v || null }

  const { error } = await supabase.from('staff').update(clean).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'staff', id, clean)
  revalidatePath('/admin/staff')
  revalidatePath('/principal/staff'); revalidatePath('/principal/performance'); revalidatePath('/principal')
  return {}
}

export async function deactivateStaff(id: string) {
  const supabase = await createClient()

  // Only admin can deactivate admin/principal-role staff
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') {
    const { data: target } = await supabase.from('staff').select('role').eq('id', id).single()
    if (target?.role === 'admin' || target?.role === 'principal')
      return { error: 'Only an admin can deactivate a ' + target!.role + ' staff member' }
  }

  const { error } = await supabase.from('staff').update({ status: 'removed' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('deactivate', 'staff', id)
  revalidatePath('/admin/staff')
  revalidatePath('/principal/staff'); revalidatePath('/principal/performance'); revalidatePath('/principal')
  return {}
}

export async function assignClassTeacher(teacherId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_class_assignments').upsert({ teacher_id: teacherId, class_id: classId })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'teacher_class_assignments', undefined, { teacherId, classId })
  revalidatePath('/admin/assignments')
  revalidatePath('/principal/assignments')
  return {}
}

export async function removeClassTeacher(classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_class_assignments').delete().eq('class_id', classId)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'teacher_class_assignments', undefined, { classId })
  revalidatePath('/admin/assignments')
  revalidatePath('/principal/assignments')
  return {}
}

export async function assignSubjectTeacher(teacherId: string, subjectId: string, classId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_subject_assignments').insert({ teacher_id: teacherId, subject_id: subjectId, class_id: classId })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'teacher_subject_assignments', undefined, { teacherId, subjectId, classId })
  revalidatePath('/admin/assignments')
  revalidatePath('/principal/assignments')
  return {}
}

export async function removeSubjectTeacher(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teacher_subject_assignments').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'teacher_subject_assignments', id)
  revalidatePath('/admin/assignments')
  revalidatePath('/principal/assignments')
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
  revalidatePath('/principal/assignments'); revalidatePath('/principal/performance')
  return {}
}

export async function bulkMarkAttendance(classId: string, date: string, records: { student_id: string; status: string }[]) {
  const supabase = await createClient()
  const rows = records.map(r => ({ student_id: r.student_id, class_id: classId, date, status: r.status }))
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
  if (error) return { error: error.message }
  revalidatePath('/admin/attendance')
  revalidatePath('/principal/attendance'); revalidatePath('/principal')
  return {}
}

export async function createTimetableEntry(values: { class_id: string; subject_id: string; teacher_id: string; day_of_week: string; period_number: number; start_time: string; end_time: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('timetable').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'timetable', data.id, values)
  revalidatePath('/admin/timetable')
  revalidatePath('/principal/timetable')
  return { data }
}

export async function deleteTimetableEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('timetable').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'timetable', id)
  revalidatePath('/admin/timetable')
  revalidatePath('/principal/timetable')
  return {}
}

export async function createFee(values: { student_id: string; amount_due: number; due_date: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('fees').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'fees', data.id, values)
  revalidatePath('/admin/fees')
  revalidatePath('/principal/fees'); revalidatePath('/principal')
  return { data }
}

export async function updateFeePayment(id: string, amountPaid: number, receiptNumber?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fees').update({ amount_paid: amountPaid, receipt_number: receiptNumber || null }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'fees', id, { amountPaid, receiptNumber })
  revalidatePath('/admin/fees')
  revalidatePath('/principal/fees'); revalidatePath('/principal')
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
  revalidatePath('/principal/announcements'); revalidatePath('/principal')
  return { data }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'announcements', id)
  revalidatePath('/admin/announcements')
  revalidatePath('/principal/announcements'); revalidatePath('/principal')
  return {}
}

export async function createExam(values: { name: string; class_id: string; start_date: string; end_date: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('exams').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'exams', data.id, values)
  revalidatePath('/admin/exams')
  revalidatePath('/principal/exams')
  return { data }
}

export async function deleteExam(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'exams', id)
  revalidatePath('/admin/exams')
  revalidatePath('/principal/exams')
  return {}
}

export async function assignExamDuty(examId: string, teacherId: string, classId: string, role: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exam_duties').insert({ exam_id: examId, teacher_id: teacherId, class_id: classId, role })
  if (error) return { error: error.message }
  await logAuditEvent('assign', 'exam_duties', undefined, { examId, teacherId, classId, role })
  revalidatePath('/admin/exams')
  revalidatePath('/principal/exams')
  return {}
}

export async function removeExamDuty(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('exam_duties').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('remove', 'exam_duties', id)
  revalidatePath('/admin/exams')
  revalidatePath('/principal/exams')
  return {}
}

export async function approveLeaveRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leave_requests').update({ status: 'approved' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('approve', 'leave_requests', id)
  revalidatePath('/admin/leave')
  revalidatePath('/principal/leave'); revalidatePath('/principal')
  return {}
}

export async function rejectLeaveRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('reject', 'leave_requests', id)
  revalidatePath('/admin/leave')
  revalidatePath('/principal/leave'); revalidatePath('/principal')
  return {}
}

export async function createParent(values: { name: string; email: string; phone?: string }) {
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') return { error: 'Only an admin can add parent accounts' }
  const supabase = await createClient()
  const { data, error } = await supabase.from('parents').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'parents', data.id, values)
  revalidatePath('/admin/staff')
  return { data }
}

export async function deactivateParent(id: string) {
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') return { error: 'Only an admin can remove parent accounts' }
  const supabase = await createClient()
  const { error } = await supabase.from('parents').update({ status: 'removed' }).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('deactivate', 'parents', id)
  revalidatePath('/admin/staff')
  return {}
}

export async function createSubject(name: string) {
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') return { error: 'Only an admin can manage subjects' }
  const supabase = await createClient()
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Subject name is required' }
  const { data, error } = await supabase.from('subjects').insert({ name: trimmed }).select().single()
  if (error) return { error: error.message.includes('duplicate') ? 'Subject already exists' : error.message }
  await logAuditEvent('create', 'subjects', data.id, { name: trimmed })
  revalidatePath('/admin/settings')
  return { data }
}

export async function deleteSubject(id: string) {
  const callerRole = await getUserRole()
  if (callerRole !== 'admin') return { error: 'Only an admin can manage subjects' }
  const supabase = await createClient()
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('delete', 'subjects', id)
  revalidatePath('/admin/settings')
  return {}
}
