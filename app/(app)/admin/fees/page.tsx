import { createClient } from '@/lib/supabase/server'
import { FeesClient } from '@/components/admin/fees-client'
import type { StudentRow, FeeRow, ClassRow } from '@/lib/types'

export default async function FeesPage() {
  const sb = await createClient()
  const [fees, students, classes] = await Promise.all([
    sb.from('fees').select('*').order('created_at', { ascending: false }),
    sb.from('students').select('id,name,roll_number,class_id'),
    sb.from('classes').select('*'),
  ])
  return (
    <FeesClient
      fees={(fees.data ?? []) as FeeRow[]}
      students={(students.data ?? []) as StudentRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      error={fees.error?.message ?? students.error?.message}
    />
  )
}
