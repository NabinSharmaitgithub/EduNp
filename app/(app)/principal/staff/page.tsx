import { createClient } from '@/lib/supabase/server'
import { PrincipalStaffClient } from '@/components/principal/staff-client'
import type { StaffRow, ClassRow, SubjectRow } from '@/lib/types'

export default async function PrincipalStaffPage() {
  const sb = await createClient()

  const [staffRes, classesRes, subjectsRes] = await Promise.all([
    sb.from('staff').select('*').order('name'),
    sb.from('classes').select('*').order('name'),
    sb.from('subjects').select('*').order('name'),
  ])

  const staff = ((staffRes.data ?? []) as StaffRow[]).filter(s => s.role === 'teacher' || s.role === 'helping_staff')
  const classes = (classesRes.data ?? []) as ClassRow[]
  const subjects = (subjectsRes.data ?? []) as SubjectRow[]

  const error = staffRes.error?.message ?? classesRes.error?.message

  return (
    <PrincipalStaffClient staff={staff} classes={classes} subjects={subjects} error={error} />
  )
}
