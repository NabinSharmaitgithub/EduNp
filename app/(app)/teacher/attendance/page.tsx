import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import { TeacherAttendanceClient } from '@/components/teacher/attendance-client'
import type { ClassRow, StudentRow, AttendanceRow, TeacherClassAssignment } from '@/lib/types'

export default async function TeacherAttendancePage() {
  const profile = await getUserProfile()
  if (!profile || !profile.staffId) redirect('/login')
  const sb = await createClient()

  const { data: assignments } = await sb.from('teacher_class_assignments').select('class_id').eq('teacher_id', profile.staffId)
  const classIds = (assignments ?? []).map(a => a.class_id)

  const [classes, students, attendance] = await Promise.all([
    classIds.length > 0 ? sb.from('classes').select('*').in('id', classIds) : { data: [] },
    classIds.length > 0 ? sb.from('students').select('*').in('class_id', classIds) : { data: [] },
    classIds.length > 0 ? sb.from('attendance').select('*').order('date', { ascending: false }).limit(500) : { data: [] },
  ])

  return (
    <TeacherAttendanceClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      attendance={(attendance.data ?? []) as AttendanceRow[]}
    />
  )
}
