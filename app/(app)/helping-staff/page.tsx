import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { HelpingStaffDashboardClient } from '@/components/helping-staff/dashboard-client'
import type { AnnouncementRow, TimetableRow, ClassRow, SubjectRow } from '@/lib/types'

export default async function HelpingStaffDashboardPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const [timetableRes, announcementsRes, classesRes, subjectsRes] = await Promise.all([
    sb.from('timetable').select('*'),
    sb.from('announcements').select('*').eq('target', 'school').order('created_at', { ascending: false }),
    sb.from('classes').select('*'),
    sb.from('subjects').select('*'),
  ])

  return (
    <HelpingStaffDashboardClient
      timetable={(timetableRes.data ?? []) as TimetableRow[]}
      announcements={(announcementsRes.data ?? []) as AnnouncementRow[]}
      classes={(classesRes.data ?? []) as ClassRow[]}
      subjects={(subjectsRes.data ?? []) as SubjectRow[]}
    />
  )
}
