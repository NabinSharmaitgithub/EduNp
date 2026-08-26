import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { StaffClient } from '@/components/admin/staff-client'
import type { StaffRow, ParentRow, ClassRow, SubjectRow } from '@/lib/types'

export default async function StaffPage() {
  const sb = await createClient()
  const profile = await getUserProfile()
  const [staff, parents, classes, subjects] = await Promise.all([
    sb.from('staff').select('*').order('name'),
    sb.from('parents').select('*').order('name'),
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
  ])
  return (
    <StaffClient
      staff={(staff.data ?? []) as StaffRow[]}
      parents={(parents.data ?? []) as ParentRow[]}
      classes={(classes.data ?? []) as ClassRow[]}
      subjects={(subjects.data ?? []) as SubjectRow[]}
      profile={profile}
      error={staff.error?.message ?? parents.error?.message}
    />
  )
}
