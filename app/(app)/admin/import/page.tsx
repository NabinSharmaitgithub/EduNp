import { createClient } from '@/lib/supabase/server'
import { ImportClient } from '@/components/admin/import-client'
import type { ClassRow, SubjectRow } from '@/lib/types'

export default async function ImportPage() {
  const sb = await createClient()
  const [classes, subjects] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
  ])
  return (
    <ImportClient
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
    />
  )
}
