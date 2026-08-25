import { createClient } from '@/lib/supabase/server'
import { ExamsClient } from '@/components/admin/exams-client'
import type { ExamRow, ExamDutyRow, StaffRow, ClassRow } from '@/lib/types'

export default async function ExamsPage() {
  const sb = await createClient()
  const [exams, duties, teachers, classes] = await Promise.all([
    sb.from('exams').select('*').order('start_date', { ascending: false }),
    sb.from('exam_duties').select('*'),
    sb.from('staff').select('*').eq('role', 'teacher').eq('status', 'active').order('name'),
    sb.from('classes').select('*').order('name'),
  ])
  return (
    <ExamsClient
      exams={(exams.data ?? []) as ExamRow[]}
      duties={(duties.data ?? []) as ExamDutyRow[]}
      teachers={(teachers.data ?? []) as StaffRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      error={exams.error?.message ?? duties.error?.message}
    />
  )
}
