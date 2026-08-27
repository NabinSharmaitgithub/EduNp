import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { HelpingStaffAnnouncementsClient } from '@/components/helping-staff/announcements-client'
import type { AnnouncementRow } from '@/lib/types'

export default async function HelpingStaffAnnouncementsPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: announcements } = await sb.from('announcements').select('*').eq('target', 'school').order('created_at', { ascending: false })

  return <HelpingStaffAnnouncementsClient announcements={(announcements ?? []) as AnnouncementRow[]} />
}
