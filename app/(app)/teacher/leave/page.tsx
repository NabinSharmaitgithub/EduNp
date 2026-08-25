import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherLeaveClient } from '@/components/teacher/leave-client'
import type { LeaveRequestRow } from '@/lib/types'

export default async function TeacherLeavePage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: leave } = await sb.from('leave_requests').select('*').eq('staff_id', profile.staffId).order('created_at', { ascending: false })

  return <TeacherLeaveClient leave={(leave ?? []) as LeaveRequestRow[]} />
}
