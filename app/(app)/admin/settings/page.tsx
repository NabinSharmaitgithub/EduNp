import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/admin/settings-client'
import type { SubjectRow } from '@/lib/types'

export default async function SettingsPage() {
  const sb = await createClient()
  const { data: subjects, error } = await sb.from('subjects').select('*').order('name')

  return (
    <SettingsClient
      subjects={(subjects ?? []) as SubjectRow[]}
      error={error?.message}
    />
  )
}
