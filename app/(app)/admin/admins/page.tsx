import { createClient } from '@/lib/supabase/server'
import { AdminsClient } from '@/components/admin/admins-client'
import type { StaffRow } from '@/lib/types'

export default async function AdminsPage() {
  const sb = await createClient()
  const { data, error } = await sb.from('staff').select('*').in('role', ['admin', 'principal']).order('role').order('name')

  return (
    <AdminsClient
      admins={(data ?? []) as StaffRow[]}
      error={error?.message}
    />
  )
}
