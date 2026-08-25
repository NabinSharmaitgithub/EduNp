import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherTimetableClient } from '@/components/teacher/timetable-client'
import type { ClassRow, SubjectRow, StaffRow, TimetableRow } from '@/lib/types'

export default async function TeacherTimetablePage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const [timetable, classes, subjects] = await Promise.all([
    sb.from('timetable').select('*').eq('teacher_id', profile.staffId).order('day_of_week'),
    sb.from('classes').select('*'),
    sb.from('subjects').select('*'),
  ])

  return (
    <TeacherTimetableClient
      timetable={(timetable.data ?? []) as TimetableRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  )
}
