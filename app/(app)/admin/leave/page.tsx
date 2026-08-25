import { createClient } from '@/lib/supabase/server'
import { LeaveAdminClient } from '@/components/admin/leave-client'
import type { LeaveRequestRow, StaffRow } from '@/lib/types'

export default async function LeavePage() {
  const sb = await createClient()
  const [leave, staff] = await Promise.all([
    sb.from('leave_requests').select('*').order('created_at', { ascending: false }),
    sb.from('staff').select('*').eq('status', 'active'),
  ])
  return (
    <LeaveAdminClient
      leave={(leave.data ?? []) as LeaveRequestRow[]}
      staff={(staff.data ?? []) as StaffRow[]}
      error={leave.error?.message}
    />
  )
}
