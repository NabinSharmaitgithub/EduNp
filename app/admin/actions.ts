'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent, getCurrentStaffId } from '@/lib/role'

export async function createStaff(values: { name: string; email: string; role: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('staff').insert(values).select().single()
  if (error) return { error: error.message }
  await logAuditEvent('create', 'staff', data.id, values)
  revalidatePath('/admin/staff')
  return { data }
}

export async function updateStaff(id: string, values: { name?: string; email?: string; role?: string; status?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('staff').update(values).eq('id', id)
  if (error) return { error: error.message }
  await logAuditEvent('update', 'staff', id, values)
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
