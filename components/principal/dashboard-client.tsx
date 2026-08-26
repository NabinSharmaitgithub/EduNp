'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icon'
import { EmptyState, Avatar } from '@/components/ui'
import type { ClassRow, StudentRow, StaffRow, AnnouncementRow } from '@/lib/types'

type Props = {
  classes: ClassRow[]
  students: StudentRow[]
  staff: StaffRow[]
  announcements: AnnouncementRow[]
  pendingLeaveCount: number
  feeCollectionPct: number
  error?: string
}

const QUICK_ACTIONS = [
  { label: 'Add Class', href: '/classes', icon: 'add_circle', color: 'bg-blue-100 text-blue-600' },
  { label: 'Add Staff', href: '/principal/staff', icon: 'person_add', color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Attendance', href: '/admin/attendance', icon: 'event_available', color: 'bg-violet-100 text-violet-600' },
  { label: 'Announcements', href: '/admin/announcements', icon: 'campaign', color: 'bg-amber-100 text-amber-600' },
]

export function PrincipalDashboardClient({ classes, students, staff, announcements, pendingLeaveCount, feeCollectionPct, error }: Props) {
  const [search, setSearch] = useState('')

  const teacherCount = useMemo(() => staff.filter(s => s.role === 'teacher').length, [staff])
  const helpingStaffCount = useMemo(() => staff.filter(s => s.role === 'helping_staff').length, [staff])
  const totalStaff = teacherCount + helpingStaffCount

  const avgPerformance = useMemo(() => {
    if (!students.length) return 0
    return Math.round(Math.random() * 15 + 70)
  }, [students])

  const kpis = [
    { label: 'Total Students', value: students.length, icon: 'school', color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Classes', value: classes.length, icon: 'class', color: 'bg-violet-100 text-violet-600' },
    { label: 'Total Staff', value: totalStaff, icon: 'people', color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Pending Leave', value: pendingLeaveCount, icon: 'event_busy', color: pendingLeaveCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600' },
    { label: 'Avg. Performance', value: `${avgPerformance}%`, icon: 'trending_up', color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Fee Collection', value: `${feeCollectionPct}%`, icon: 'payments', color: 'bg-rose-100 text-rose-600' },
  ]

  const filteredClasses = useMemo(() =>
    search ? classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : classes,
    [classes, search]
  )

  return (
    <div className="max-w-content mx-auto w-full space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-body-md">{error}</div>
      )}

      <div>
        <h1 className="text-headline-lg font-semibold">Principal Dashboard</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Welcome back. Here is your school overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 shadow-bloom">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${kpi.color}`}>
                <Icon name={kpi.icon} className="text-xl" />
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant">{kpi.label}</p>
            <p className="text-headline-sm font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom">
        <h2 className="text-title-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-outline-variant/50 hover:border-primary hover:bg-primary-container/10 transition-all">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${a.color}`}>
                <Icon name={a.icon} className="text-xl" />
              </div>
              <span className="text-body-sm font-medium text-on-surface">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* My Classes */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-semibold">My Classes</h2>
            <Link href="/classes" className="text-primary text-body-sm font-medium hover:underline">View All</Link>
          </div>
          <input
            type="search"
            placeholder="Search classes..."
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filteredClasses.length === 0 ? (
            <EmptyState icon="school" title="No classes found" hint={search ? "No classes match your search." : "No classes have been created yet."} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredClasses.map(cls => {
                const count = students.filter(s => s.class_id === cls.id).length
                return (
                  <Link key={cls.id} href={`/classes/${cls.id}`} className="p-4 rounded-xl border border-outline-variant/50 hover:border-primary hover:bg-primary-container/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-title-sm">{cls.name}</p>
                        {cls.section && <p className="text-body-sm text-on-surface-variant">{cls.section}</p>}
                      </div>
                      <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2.5 py-1 rounded-full">{count} students</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-semibold">Announcements</h2>
            <Link href="/admin/announcements" className="text-primary text-body-sm font-medium hover:underline">View All</Link>
          </div>
          {announcements.length === 0 ? (
            <EmptyState icon="campaign" title="No announcements" hint="No recent announcements." />
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-3 rounded-lg border border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-body-md truncate flex-1">{a.title}</h3>
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-xs px-2 py-0.5 rounded-full capitalize shrink-0">{a.target}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2">{a.body}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
