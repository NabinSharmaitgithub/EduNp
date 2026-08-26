import { createClient } from '@/lib/supabase/server'
import { PrincipalPerformanceClient } from '@/components/principal/performance-client'
import type { ClassRow, StudentRow, SubjectRow, MarkRow } from '@/lib/types'

export default async function PrincipalPerformancePage() {
  const sb = await createClient()

  const [classesRes, studentsRes, subjectsRes, marksRes] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
    sb.from('subjects').select('*').order('name'),
    sb.from('marks').select('*'),
  ])

  const classes = (classesRes.data ?? []) as ClassRow[]
  const students = (studentsRes.data ?? []) as StudentRow[]
  const subjects = (subjectsRes.data ?? []) as SubjectRow[]
  const marks = (marksRes.data ?? []) as MarkRow[]

  const error = classesRes.error?.message ?? studentsRes.error?.message ?? marksRes.error?.message

  return (
    <PrincipalPerformanceClient classes={classes} students={students} subjects={subjects} marks={marks} error={error} />
  )
}
