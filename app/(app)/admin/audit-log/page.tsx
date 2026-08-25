import { createClient } from '@/lib/supabase/server'
import { AuditLogClient } from '@/components/admin/audit-log-client'
import type { AuditLogRow, StaffRow } from '@/lib/types'

export default async function AuditLogPage() {
  const sb = await createClient()
  const [logs, staff] = await Promise.all([
    sb.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(200),
    sb.from('staff').select('*'),
  ])
  return (
    <AuditLogClient
      logs={(logs.data ?? []) as AuditLogRow[]}
      staff={(staff.data ?? []) as StaffRow[]}
      error={logs.error?.message}
    />
  )
}
