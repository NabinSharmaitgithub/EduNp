'use client'

import type { ClassRow, StudentRow, StaffRow, FeeRow, LeaveRequestRow } from '@/lib/types'
import { useToast } from '@/components/toast'
import { Icon } from '@/components/icon'
import { btnPrimary, btnOutline, Avatar, EmptyState } from '@/components/ui'
import Link from 'next/link'

type Props = {
  classes: ClassRow[]; students: StudentRow[]; staff: StaffRow[]
  fees: FeeRow[]; leaveRequests: LeaveRequestRow[]; error?: string
}

const roleColors: Record<string, string> = {
  admin: 'bg-amber-500',
  principal: 'bg-blue-600',
  teacher: 'bg-emerald-500',
  helping_staff: 'bg-violet-500',
}

const roleLabels: Record<string, string> = {
  admin: 'Admins',
  principal: 'Principals',
  teacher: 'Teachers',
  helping_staff: 'Helping Staff',
}

export default function AdminDashboardClient({ classes, students, staff, fees, leaveRequests, error }: Props) {
  const toast = useToast()

  const activeStaff = staff.filter((s) => s.status === 'active')
  const totalStaff = activeStaff.length
  const totalStudents = students.length
  const totalClasses = classes.length
  const pendingLeave = leaveRequests.filter((l) => l.status === 'pending').length
  const totalDue = fees.reduce((s, f) => s + (f.amount_due ?? 0), 0)
  const totalPaid = fees.reduce((s, f) => s + (f.amount_paid ?? 0), 0)
  const feePercent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

  const roleCounts: Record<string, number> = {}
  for (const r of activeStaff) {
    const role = r.role ?? 'unknown'
    roleCounts[role] = (roleCounts[role] || 0) + 1
  }

  const parentCount = 0

  const kpis = [
    { label: 'Total Staff', icon: 'people', value: totalStaff, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Students', icon: 'school', value: totalStudents, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total Classes', icon: 'class', value: totalClasses, color: 'bg-violet-100 text-violet-600' },
    { label: 'Pending Leave', icon: 'event_busy', value: pendingLeave, color: 'bg-amber-100 text-amber-600' },
    { label: 'Fee Collection', icon: 'payments', value: `${feePercent}%`, color: 'bg-rose-100 text-rose-600' },
  ]

  return (
    <div className="max-w-content mx-auto w-full space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-body-md">
          {error}
        </div>
      )}

      <h1 className="text-headline-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom"
          >
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${kpi.color}`}>
                <Icon name={kpi.icon} />
              </div>
              <div>
                <p className="text-body-sm text-on-surface-variant">{kpi.label}</p>
                <p className="text-headline-md font-semibold">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/50 shadow-bloom">
        <h2 className="text-title-lg font-semibold mb-4">System Health</h2>
        <div className="space-y-3">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role}>
              <div className="flex items-center justify-between text-body-md mb-1">
                <span>{roleLabels[role] ?? role}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${roleColors[role] ?? 'bg-gray-400'}`}
                  style={{ width: totalStaff > 0 ? `${(count / totalStaff) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-body-md text-on-surface-variant">
          Parents: <span className="font-medium text-on-surface">{parentCount}</span>
        </div>
      </div>

      <div>
        <h2 className="text-title-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/admins"
            className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 shadow-bloom hover:shadow-bloom-hover transition-shadow cursor-pointer flex items-center gap-3"
          >
            <Icon name="shield" />
            <span className="text-body-lg font-medium">Add Admin</span>
          </Link>
          <Link
            href="/admin/admins"
            className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 shadow-bloom hover:shadow-bloom-hover transition-shadow cursor-pointer flex items-center gap-3"
          >
            <Icon name="school" />
            <span className="text-body-lg font-medium">Add Principal</span>
          </Link>
          <Link
            href="/admin/staff"
            className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 shadow-bloom hover:shadow-bloom-hover transition-shadow cursor-pointer flex items-center gap-3"
          >
            <Icon name="person_add" />
            <span className="text-body-lg font-medium">Add Staff</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
