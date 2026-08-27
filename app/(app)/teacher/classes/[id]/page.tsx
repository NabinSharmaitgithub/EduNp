import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherClassDetailClient } from '@/components/teacher/class-detail-client'
import type { StudentRow, MarkRow, SubjectRow } from '@/lib/types'

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const { id } = await params
  const sb = await createClient()

  const { data: assignment } = await sb.from('teacher_class_assignments').select('class_id').eq('teacher_id', profile.staffId).eq('class_id', id).single()
  if (!assignment) notFound()

  const { data: cls } = await sb.from('classes').select('*').eq('id', id).single()
  if (!cls) notFound()

  const [{ data: students }, { data: marks }, { data: subjects }] = await Promise.all([
    sb.from('students').select('*').eq('class_id', id),
    sb.from('marks').select('id,student_id,subject_id,exam_term,marks_obtained,max_marks'),
    sb.from('subjects').select('*'),
  ])

  return (
    <TeacherClassDetailClient
      className={cls.name}
      classId={id}
      students={(students ?? []) as StudentRow[]}
      marks={(marks ?? []) as MarkRow[]}
      subjects={(subjects ?? []) as SubjectRow[]}
    />
  )
}
