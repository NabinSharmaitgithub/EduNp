import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherDashboardClient } from '@/components/teacher/dashboard-client'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, TeacherSubjectAssignment, TimetableRow } from '@/lib/types'

export default async function TeacherDashboardPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: classAssignments } = await sb.from('teacher_class_assignments').select('class_id').eq('teacher_id', profile.staffId)
  const classIds = [...new Set((classAssignments ?? []).map(a => a.class_id))]

  if (classIds.length === 0) {
    return <TeacherDashboardClient classes={[]} students={[]} marks={[]} subjects={[]} timetable={[]} examsCount={0} />
  }

  const { data: subjectAssignments } = await sb.from('teacher_subject_assignments').select('subject_id, class_id').eq('teacher_id', profile.staffId)

  const [classesRes, studentsRes, marksRes, subjectsRes, timetableRes, examsRes] = await Promise.all([
    sb.from('classes').select('*').in('id', classIds),
    sb.from('students').select('*').in('class_id', classIds),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
    sb.from('subjects').select('*'),
    sb.from('timetable').select('*').eq('teacher_id', profile.staffId),
    sb.from('exams').select('id'),
  ])

  const subjectIds = [...new Set((subjectAssignments ?? []).map(a => a.subject_id))]

  return (
    <TeacherDashboardClient
      classes={(classesRes.data ?? []) as ClassRow[]}
      students={(studentsRes.data ?? []) as StudentRow[]}
      marks={(marksRes.data ?? []) as MarkRow[]}
      subjects={(subjectsRes.data ?? []).filter((s: SubjectRow) => subjectIds.includes(s.id)) as SubjectRow[]}
      timetable={(timetableRes.data ?? []) as TimetableRow[]}
      examsCount={examsRes.data?.length ?? 0}
    />
  )
}
