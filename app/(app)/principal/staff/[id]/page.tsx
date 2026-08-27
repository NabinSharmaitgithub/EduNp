import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StaffProfileClient } from '@/components/admin/staff-profile-client'
import type { StaffRow, ClassRow, SubjectRow, TeacherClassAssignment, TeacherSubjectAssignment } from '@/lib/types'

export default async function PrincipalStaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await createClient()

  const { data: staff } = await sb.from('staff').select('*').eq('id', id).single()
  if (!staff) notFound()

  const [classes, subjects, classAssign, subjectAssign] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
    sb.from('teacher_class_assignments').select('*').eq('teacher_id', id),
    sb.from('teacher_subject_assignments').select('*').eq('teacher_id', id),
  ])

  return (
    <StaffProfileClient
      staff={staff as StaffRow}
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      classAssign={classAssign.data as TeacherClassAssignment[] | null}
      subjectAssign={subjectAssign.data as TeacherSubjectAssignment[] | null}
      readOnly
      backHref="/principal/staff"
    />
  )
}