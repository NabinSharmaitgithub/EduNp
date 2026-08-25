'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffId } from '@/lib/role'

export async function bulkMarkAttendance(classId: string, date: string, records: { student_id: string; status: string }[]) {
  const supabase = await createClient()
  const rows = records.map(r => ({ student_id: r.student_id, class_id: classId, date, status: r.status }))
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
  if (error) return { error: error.message }
  revalidatePath('/teacher/attendance')
  return {}
}

export async function enterMark(studentId: string, subjectId: string, examTerm: string, marksObtained: number, maxMarks: number) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('marks').select('id').eq('student_id', studentId).eq('subject_id', subjectId).eq('exam_term', examTerm).single()
  if (existing) {
    const { error } = await supabase.from('marks').update({ marks_obtained: marksObtained, max_marks: maxMarks }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('marks').insert({ student_id: studentId, subject_id: subjectId, exam_term: examTerm, marks_obtained: marksObtained, max_marks: maxMarks })
    if (error) return { error: error.message }
  }
  revalidatePath('/teacher/marks')
  return {}
}

export async function submitLeaveRequest(startDate: string, endDate: string, reason: string) {
  const supabase = await createClient()
  const staffId = await getCurrentStaffId()
  if (!staffId) return { error: 'Not authorized' }
  const { error } = await supabase.from('leave_requests').insert({ staff_id: staffId, start_date: startDate, end_date: endDate, reason })
  if (error) return { error: error.message }
  revalidatePath('/teacher/leave')
  return {}
}

export async function cancelLeaveRequest(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leave_requests').delete().eq('id', id).eq('status', 'pending')
  if (error) return { error: error.message }
  revalidatePath('/teacher/leave')
  return {}
}
