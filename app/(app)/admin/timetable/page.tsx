import { createClient } from '@/lib/supabase/server'
import { TimetableClient } from '@/components/admin/timetable-client'
import type { ClassRow, SubjectRow, StaffRow, TimetableRow } from '@/lib/types'

export default async function TimetablePage() {
  const sb = await createClient()
  const [timetable, classes, subjects, teachers] = await Promise.all([
    sb.from('timetable').select('*').order('day_of_week'),
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
    sb.from('staff').select('*').eq('role', 'teacher').eq('status', 'active').order('name'),
  ])
  return (
    <TimetableClient
      timetable={(timetable.data ?? []) as TimetableRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      teachers={(teachers.data ?? []) as StaffRow[]}
      error={timetable.error?.message}
    />
  )
}
