import { createClient } from '@/lib/supabase/server'
import { AttendancePageClient } from '@/components/admin/attendance-client'
import type { ClassRow, StudentRow, AttendanceRow } from '@/lib/types'

export default async function AttendancePage() {
  const sb = await createClient()
  const [classes, students, attendance] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
    sb.from('attendance').select('*').order('date', { ascending: false }).limit(500),
  ])
  return (
    <AttendancePageClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      attendance={(attendance.data ?? []) as AttendanceRow[]}
      error={classes.error?.message ?? students.error?.message ?? attendance.error?.message}
    />
  )
}
