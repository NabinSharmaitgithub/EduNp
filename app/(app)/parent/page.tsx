import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { ParentDashboardClient } from '@/components/parent/dashboard-client'
import type { StudentRow, ClassRow, MarkRow, SubjectRow, AttendanceRow, FeeRow } from '@/lib/types'

export default async function ParentPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.parentId) redirect('/login')
  const sb = await createClient()

  const { data: child } = await sb.from('students').select('*').eq('parent_id', profile.parentId).limit(1).single()
  if (!child) {
    return (
      <div className="max-w-content mx-auto w-full p-6">
        <h1 className="text-headline-lg mb-4">Welcome, {profile.name}</h1>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-8 text-center">
          <p className="text-on-surface-variant">No student account is linked to your profile. Please contact the school admin.</p>
        </div>
      </div>
    )
  }

  const student = child as StudentRow
  const [cls, marks, subjects, attendance, fees] = await Promise.all([
    sb.from('classes').select('*').eq('id', student.class_id).single(),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks').eq('student_id', student.id),
    sb.from('subjects').select('*'),
    sb.from('attendance').select('*').eq('student_id', student.id).order('date', { ascending: false }).limit(30),
    sb.from('fees').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
  ])

  return (
    <ParentDashboardClient
      student={student}
      cls={(cls.data ?? null) as ClassRow | null}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      attendance={(attendance.data ?? []) as AttendanceRow[]}
      fees={(fees.data ?? []) as FeeRow[]}
      parentName={profile.name}
    />
  )
}
