import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { HelpingStaffTimetableClient } from '@/components/helping-staff/timetable-client'
import type { TimetableRow, ClassRow, SubjectRow } from '@/lib/types'

export default async function HelpingStaffTimetablePage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const [timetableRes, classesRes, subjectsRes] = await Promise.all([
    sb.from('timetable').select('*'),
    sb.from('classes').select('*'),
    sb.from('subjects').select('*'),
  ])

  return (
    <HelpingStaffTimetableClient
      timetable={(timetableRes.data ?? []) as TimetableRow[]}
      classes={(classesRes.data ?? []) as ClassRow[]}
      subjects={(subjectsRes.data ?? []) as SubjectRow[]}
    />
  )
}
