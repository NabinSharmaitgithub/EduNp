import { createClient } from '@/lib/supabase/server'
import DirectoryClient from '@/components/admin/directory-client'
import type { StaffRow, ClassRow, SubjectRow } from '@/lib/types'

export default async function DirectoryPage() {
  const sb = await createClient()
  const [staffRes, classesRes, subjectsRes] = await Promise.all([
    sb.from('staff').select('*').order('name'),
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
  ])

  return (
    <DirectoryClient
      staff={(staffRes.data ?? []) as StaffRow[]}
      classes={(classesRes.data ?? []) as ClassRow[]}
      subjects={(subjectsRes.data ?? []) as SubjectRow[]}
      error={staffRes.error?.message}
    />
  )
}
