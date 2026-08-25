'use client'

import { useMemo, useState } from 'react'
import { EmptyState, inputCls } from '@/components/ui'
import type { AuditLogRow, StaffRow } from '@/lib/types'

export function AuditLogClient({ logs, staff, error }: { logs: AuditLogRow[]; staff: StaffRow[]; error?: string }) {
  const [tableFilter, setTableFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const actorName = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s.name])), [staff])
  const tables = useMemo(() => [...new Set(logs.map(l => l.target_table))].sort(), [logs])
  const actions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs])

  const filtered = useMemo(() =>
    logs.filter(l => (tableFilter === 'all' || l.target_table === tableFilter) && (actionFilter === 'all' || l.action === actionFilter)),
    [logs, tableFilter, actionFilter]
  )

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Audit Log</h1>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="flex gap-3 mb-6">
        <select className={`${inputCls} sm:w-44`} value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
          <option value="all">All Tables</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={`${inputCls} sm:w-44`} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📜" title="No audit records" />
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Time</th>
                <th className="py-3 px-6 font-medium">Actor</th>
                <th className="py-3 px-6 font-medium">Action</th>
                <th className="py-3 px-6 font-medium">Table</th>
                <th className="py-3 px-6 font-medium">Target ID</th>
                <th className="py-3 px-6 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="py-3 px-6 text-body-sm text-on-surface-variant whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-6 font-medium">{actorName[l.actor_id ?? ''] ?? '—'}</td>
                  <td className="py-3 px-6"><span className="bg-surface-container-high text-on-surface-variant text-label-md px-2 py-0.5 rounded-full capitalize">{l.action}</span></td>
                  <td className="py-3 px-6 text-on-surface-variant">{l.target_table}</td>
                  <td className="py-3 px-6 text-on-surface-variant text-body-sm font-mono">{l.target_id?.slice(0, 8) ?? '—'}</td>
                  <td className="py-3 px-6 text-body-sm text-on-surface-variant max-w-xs truncate">{l.details ? JSON.stringify(l.details) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
