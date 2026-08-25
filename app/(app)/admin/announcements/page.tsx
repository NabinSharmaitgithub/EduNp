import { createClient } from '@/lib/supabase/server'
import { AnnouncementsClient } from '@/components/admin/announcements-client'
import type { AnnouncementRow, ClassRow } from '@/lib/types'

export default async function AnnouncementsPage() {
  const sb = await createClient()
  const [announcements, classes] = await Promise.all([
    sb.from('announcements').select('*').order('created_at', { ascending: false }),
    sb.from('classes').select('*').order('name'),
  ])
  return (
    <AnnouncementsClient
      announcements={(announcements.data ?? []) as AnnouncementRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      error={announcements.error?.message}
    />
  )
}
