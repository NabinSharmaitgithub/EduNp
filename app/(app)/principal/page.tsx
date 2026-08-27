import { createClient } from '@/lib/supabase/server'
import { PrincipalDashboardClient } from '@/components/principal/dashboard-client'
import { computeStudentStats } from '@/lib/stats'
import type { ClassRow, StudentRow, StaffRow, AnnouncementRow, FeeRow, LeaveRequestRow, MarkRow } from '@/lib/types'

export default async function PrincipalDashboardPage() {
  const sb = await createClient()

  const [classesRes, studentsRes, staffRes, announcementsRes, feesRes, leaveRes, marksRes] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
    sb.from('staff').select('*').eq('status', 'active'),
    sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
    sb.from('fees').select('*'),
    sb.from('leave_requests').select('*').eq('status', 'pending'),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
  ])

  const classes = (classesRes.data ?? []) as ClassRow[]
  const students = (studentsRes.data ?? []) as StudentRow[]
  const staff = (staffRes.data ?? []) as StaffRow[]
  const announcements = (announcementsRes.data ?? []) as AnnouncementRow[]
  const fees = (feesRes.data ?? []) as FeeRow[]
  const pendingLeave = (leaveRes.data ?? []) as LeaveRequestRow[]
  const marks = (marksRes.data ?? []) as MarkRow[]

  const error = classesRes.error?.message ?? studentsRes.error?.message ?? staffRes.error?.message

  const totalDue = fees.reduce((a, f) => a + (f.amount_due ?? 0), 0)
  const totalPaid = fees.reduce((a, f) => a + (f.amount_paid ?? 0), 0)
  const feeCollectionPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

  const stats = computeStudentStats(students, marks)
  const graded = stats.filter(s => s.pct !== null)
  const avgPerformancePct = graded.length
    ? Math.round((graded.reduce((a, s) => a + s.total, 0) / graded.reduce((a, s) => a + s.totalMax, 0)) * 100)
    : 0

  return (
    <PrincipalDashboardClient
      classes={classes}
      students={students}
      staff={staff}
      announcements={announcements}
      pendingLeaveCount={pendingLeave.length}
      feeCollectionPct={feeCollectionPct}
      avgPerformancePct={avgPerformancePct}
      error={error}
    />
  )
}
