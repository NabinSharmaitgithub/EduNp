import { createClient } from '@/lib/supabase/server'
import { StaffClient } from '@/components/admin/staff-client'
import type { StaffRow, ParentRow } from '@/lib/types'

export default async function StaffPage() {
  const sb = await createClient()
  const [staff, parents] = await Promise.all([
    sb.from('staff').select('*').order('name'),
    sb.from('parents').select('*').order('name'),
  ])
  return (
    <StaffClient
      staff={(staff.data ?? []) as StaffRow[]}
      parents={(parents.data ?? []) as ParentRow[]}
      error={staff.error?.message ?? parents.error?.message}
    />
  )
}
