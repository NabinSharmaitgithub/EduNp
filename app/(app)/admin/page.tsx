import { createClient } from '@/lib/supabase/server'
import { AdminAnalyticsClient } from '@/components/admin/analytics-client'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, StaffRow, FeeRow, AttendanceRow } from '@/lib/types'

export default async function AdminAnalyticsPage() {
  const sb = await createClient()
  const [classes, students, marks, subjects, staff, fees, attendance] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
    sb.from('subjects').select('*').order('name'),
    sb.from('staff').select('*').eq('status', 'active'),
    sb.from('fees').select('id,student_id,amount_due,amount_paid,status'),
    sb.from('attendance').select('id,student_id,class_id,date,status'),
  ])

  const error = classes.error?.message ?? students.error?.message ?? marks.error?.message ?? subjects.error?.message ?? staff.error?.message ?? fees.error?.message ?? attendance.error?.message

  return (
    <AdminAnalyticsClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      staff={(staff.data ?? []) as StaffRow[]}
      fees={(fees.data ?? []) as FeeRow[]}
      attendance={(attendance.data ?? []) as AttendanceRow[]}
      error={error}
    />
  )
}
