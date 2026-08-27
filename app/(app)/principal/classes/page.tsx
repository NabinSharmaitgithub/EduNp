import { createClient } from '@/lib/supabase/server'
import { ClassesClient } from '@/components/classes-client'
import type { ClassRow, StudentRow } from '@/lib/types'

export default async function PrincipalClassesPage() {
  const sb = await createClient()
  const [classesRes, studentsRes] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
  ])
  return (
    <ClassesClient
      classes={(classesRes.data ?? []) as ClassRow[]}
      students={(studentsRes.data ?? []) as StudentRow[]}
      error={classesRes.error?.message}
    />
  )
}