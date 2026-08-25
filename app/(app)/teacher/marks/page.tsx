import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherMarksClient } from '@/components/teacher/marks-client'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, TeacherSubjectAssignment } from '@/lib/types'

export default async function TeacherMarksPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: subAssignments } = await sb.from('teacher_subject_assignments').select('subject_id, class_id').eq('teacher_id', profile.staffId)
  const subjectIds = [...new Set((subAssignments ?? []).map(a => a.subject_id))]
  const classIds = [...new Set((subAssignments ?? []).map(a => a.class_id))]

  const [classes, students, marks, subjects] = await Promise.all([
    classIds.length > 0 ? sb.from('classes').select('*').in('id', classIds) : { data: [] },
    classIds.length > 0 ? sb.from('students').select('id,name,roll_number,class_id').in('class_id', classIds) : { data: [] },
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
    subjectIds.length > 0 ? sb.from('subjects').select('*').in('id', subjectIds) : { data: [] },
  ])

  return (
    <TeacherMarksClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      marks={(marks.data ?? []) as MarkRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  )
}
