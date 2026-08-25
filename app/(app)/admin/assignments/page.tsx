import { createClient } from '@/lib/supabase/server'
import { AssignmentsClient } from '@/components/admin/assignments-client'
import type { StaffRow, ClassRow, SubjectRow, TeacherClassAssignment, TeacherSubjectAssignment } from '@/lib/types'

export default async function AssignmentsPage() {
  const sb = await createClient()
  const [teachers, classes, subjects, classAssignments, subjectAssignments] = await Promise.all([
    sb.from('staff').select('*').eq('role', 'teacher').eq('status', 'active').order('name'),
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
    sb.from('teacher_class_assignments').select('*'),
    sb.from('teacher_subject_assignments').select('*'),
  ])
  return (
    <AssignmentsClient
      teachers={(teachers.data ?? []) as StaffRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      classAssignments={(classAssignments.data ?? []) as TeacherClassAssignment[]}
      subjectAssignments={(subjectAssignments.data ?? []) as TeacherSubjectAssignment[]}
      error={teachers.error?.message ?? classes.error?.message ?? subjects.error?.message}
    />
  )
}
