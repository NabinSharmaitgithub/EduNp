'use client'

import { useMemo, useState, useTransition } from 'react'
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { LeaveRequestRow, StaffRow } from '@/lib/types'

export function LeaveAdminClient({ leave, staff, error }: { leave: LeaveRequestRow[]; staff: StaffRow[]; error?: string }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState('all')
  const staffName = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s.name])), [staff])
  const filtered = useMemo(() => filter === 'all' ? leave : leave.filter(l => l.status === filter), [leave, filter])

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  const statusColor = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Leave Requests</h1>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <select className={`${inputCls} mb-6 sm:w-44`} value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📅" title="No leave requests" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="font-semibold">{staffName[l.staff_id] ?? '—'}</p>
                <p className="text-body-sm text-on-surface-variant">{new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">{l.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`${statusColor(l.status)} text-label-md px-3 py-1 rounded-full capitalize`}>{l.status}</span>
                {l.status === 'pending' && (
                  <>
                    <button className={btnPrimary} onClick={() => run(() => approveLeaveRequest(l.id), 'Approved')}>Approve</button>
                    <button className={btnOutline} onClick={() => run(() => rejectLeaveRequest(l.id), 'Rejected')}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


