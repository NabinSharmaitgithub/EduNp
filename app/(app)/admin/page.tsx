import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from '@/components/admin/admin-dashboard-client'
import type { ClassRow, StudentRow, StaffRow, FeeRow, LeaveRequestRow } from '@/lib/types'

export default async function AdminDashboardPage() {
  const sb = await createClient()
  const [classes, students, staff, fees, leaveRequests] = await Promise.all([
    sb.from('classes').select('*').order('name'),
    sb.from('students').select('*'),
    sb.from('staff').select('*'),
    sb.from('fees').select('id,student_id,amount_due,amount_paid,status'),
    sb.from('leave_requests').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <AdminDashboardClient
      classes={(classes.data ?? []) as ClassRow[]}
      students={(students.data ?? []) as StudentRow[]}
      staff={(staff.data ?? []) as StaffRow[]}
      fees={(fees.data ?? []) as FeeRow[]}
      leaveRequests={(leaveRequests.data ?? []) as LeaveRequestRow[]}
      error={classes.error?.message ?? students.error?.message ?? staff.error?.message}
    />
  )
}
