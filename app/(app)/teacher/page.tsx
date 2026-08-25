import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherDashboardClient } from '@/components/teacher/dashboard-client'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, TeacherClassAssignment } from '@/lib/types'

export default async function TeacherDashboardPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: assignments } = await sb.from('teacher_class_assignments').select('class_id').eq('teacher_id', profile.staffId)
  const classIds = (assignments ?? []).map(a => a.class_id)

  if (classIds.length === 0) {
    return <TeacherDashboardClient classes={[]} students={[]} marks={[]} subjects={[]} />
  }

  const [classes, students, marks, subjects] = await Promise.all([
    sb.from('classes').select('*').in('id', classIds),
    sb.from('students').select('id,name,roll_number,class_id').in('class_id', classIds),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
    sb.from('subjects').select('*'),
  ])

  return (
    <TeacherDashboardClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  )
}
