'use client'

import { Icon } from '@/components/icon'

type PermissionCell = 'yes' | 'no' | 'dash' | string

const CHECK = <Icon name="check_circle" className="text-emerald-600 text-[18px]" />
const CROSS = <Icon name="cancel" className="text-red-400 text-[18px]" />
const DASH = <span className="text-on-surface-variant">—</span>

const PERMISSIONS: { feature: string; admin: PermissionCell; principal: PermissionCell; teacher: PermissionCell; helping_staff: PermissionCell; parent: PermissionCell }[] = [
  { feature: 'View Dashboard', admin: 'yes', principal: 'yes', teacher: 'yes', helping_staff: 'dash', parent: 'yes' },
  { feature: 'Manage Classes', admin: 'yes', principal: 'yes', teacher: 'own', helping_staff: 'dash', parent: 'dash' },
  { feature: 'Manage Staff', admin: 'yes', principal: 'sub', helping_staff: 'dash', teacher: 'no', parent: 'dash' },
  { feature: 'Manage Admins / Principals', admin: 'yes', principal: 'no', teacher: 'no', helping_staff: 'no', parent: 'dash' },
  { feature: 'Manage Students', admin: 'yes', principal: 'yes', teacher: 'own', helping_staff: 'dash', parent: 'dash' },
  { feature: 'Mark Attendance', admin: 'yes', principal: 'yes', teacher: 'own', helping_staff: 'dash', parent: 'dash' },
  { feature: 'Enter Marks', admin: 'yes', principal: 'yes', teacher: 'own', helping_staff: 'dash', parent: 'dash' },
  { feature: 'View Marks', admin: 'yes', principal: 'yes', teacher: 'own', helping_staff: 'dash', parent: 'child' },
  { feature: 'Manage Fees', admin: 'yes', principal: 'yes', teacher: 'view', helping_staff: 'dash', parent: 'child' },
  { feature: 'Manage Timetable', admin: 'yes', principal: 'yes', teacher: 'view', helping_staff: 'view', parent: 'view_child' },
  { feature: 'Manage Announcements', admin: 'yes', principal: 'yes', teacher: 'view', helping_staff: 'view', parent: 'view_child' },
  { feature: 'Manage Exams', admin: 'yes', principal: 'yes', teacher: 'view', helping_staff: 'dash', parent: 'view_child' },
  { feature: 'Approve Leave', admin: 'yes', principal: 'yes', teacher: 'no', helping_staff: 'no', parent: 'dash' },
  { feature: 'View Audit Log', admin: 'yes', principal: 'yes', teacher: 'no', helping_staff: 'no', parent: 'dash' },
  { feature: 'Manage Subjects', admin: 'yes', principal: 'no', teacher: 'no', helping_staff: 'no', parent: 'dash' },
  { feature: 'System Settings', admin: 'yes', principal: 'no', teacher: 'no', helping_staff: 'no', parent: 'dash' },
  { feature: 'Import Data', admin: 'yes', principal: 'yes', teacher: 'no', helping_staff: 'no', parent: 'dash' },
]

function Cell({ value }: { value: PermissionCell }) {
  if (value === 'yes') return CHECK
  if (value === 'no') return CROSS
  if (value === 'dash') return DASH
  return <span className="text-body-sm text-on-surface-variant">{value}</span>
}

export default function PermissionsClient() {
  return (
    <div className="max-w-content mx-auto w-full space-y-6 p-4">
      <div>
        <h1 className="text-headline-lg">Role & Permissions</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Reference guide for system access levels</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/50">
              <th className="px-4 py-3 text-title-sm text-on-surface min-w-[220px]">Feature</th>
              <th className="px-4 py-3 text-title-sm text-on-surface text-center">Admin</th>
              <th className="px-4 py-3 text-title-sm text-on-surface text-center">Principal</th>
              <th className="px-4 py-3 text-title-sm text-on-surface text-center">Teacher</th>
              <th className="px-4 py-3 text-title-sm text-on-surface text-center">Helping Staff</th>
              <th className="px-4 py-3 text-title-sm text-on-surface text-center">Parent</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p, i) => (
              <tr key={p.feature} className={`border-b border-outline-variant/30 ${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low/30'}`}>
                <td className="px-4 py-3 text-body-md text-on-surface font-medium">{p.feature}</td>
                <td className="px-4 py-3 text-center"><Cell value={p.admin} /></td>
                <td className="px-4 py-3 text-center"><Cell value={p.principal} /></td>
                <td className="px-4 py-3 text-center"><Cell value={p.teacher} /></td>
                <td className="px-4 py-3 text-center"><Cell value={p.helping_staff} /></td>
                <td className="px-4 py-3 text-center"><Cell value={p.parent} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 text-body-sm text-on-surface-variant">
        <p><span className="font-medium">own</span> — Only their own assigned classes / students</p>
        <p><span className="font-medium">sub</span> — Only teacher and helping staff roles (not other admins/principals)</p>
        <p><span className="font-medium">child</span> — Only their child's data</p>
        <p><span className="font-medium">view</span> — Read-only access, cannot modify</p>
        <p><span className="font-medium">view_child</span> — Read-only view of their child's data</p>
      </div>
    </div>
  )
}
