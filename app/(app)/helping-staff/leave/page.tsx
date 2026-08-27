import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { HelpingStaffLeaveClient } from '@/components/helping-staff/leave-client'
import type { LeaveRequestRow } from '@/lib/types'

export default async function HelpingStaffLeavePage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: leave } = await sb.from('leave_requests').select('*').eq('staff_id', profile.staffId).order('created_at', { ascending: false })

  return <HelpingStaffLeaveClient leave={(leave ?? []) as LeaveRequestRow[]} />
}
