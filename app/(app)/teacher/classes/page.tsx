import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherClassesClient } from '@/components/teacher/classes-client'
import type { ClassRow, StudentRow, TeacherSubjectAssignment, SubjectRow } from '@/lib/types'

export default async function TeacherClassesPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: classAssignments } = await sb.from('teacher_class_assignments').select('class_id').eq('teacher_id', profile.staffId)
  const classIds = [...new Set((classAssignments ?? []).map(a => a.class_id))]

  if (classIds.length === 0) {
    return <TeacherClassesClient classes={[]} students={[]} subjectAssignments={[]} subjects={[]} />
  }

  const [{ data: classes }, { data: students }, { data: subjectAssignments }, { data: subjects }] = await Promise.all([
    sb.from('classes').select('*').in('id', classIds),
    sb.from('students').select('*').in('class_id', classIds),
    sb.from('teacher_subject_assignments').select('*').eq('teacher_id', profile.staffId),
    sb.from('subjects').select('*'),
  ])

  return (
    <TeacherClassesClient
      classes={(classes ?? []) as ClassRow[]}
      students={(students ?? []) as StudentRow[]}
      subjectAssignments={(subjectAssignments ?? []) as TeacherSubjectAssignment[]}
      subjects={(subjects ?? []) as SubjectRow[]}
    />
  )
}
