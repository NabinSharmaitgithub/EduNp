'use client'

import { useMemo, useState } from 'react'
import { EmptyState, inputCls } from '@/components/ui'
import { Icon } from '@/components/icon'
import type { AuditLogRow, StaffRow } from '@/lib/types'

const ACTION_BADGES: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  assign: 'bg-amber-100 text-amber-700',
  remove: 'bg-amber-100 text-amber-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-red-100 text-red-700',
}

function isRoleChange(log: AuditLogRow): boolean {
  if (!log.details || (log.action !== 'update' && log.action !== 'create')) return false
  return 'role' in log.details
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export function AuditLogClient({ logs, staff, error }: { logs: AuditLogRow[]; staff: StaffRow[]; error?: string }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const actorName = useMemo(() => Object.fromEntries(staff.map(s => [s.id, s.name])), [staff])
  const tables = useMemo(() => [...new Set(logs.map(l => l.target_table))].sort(), [logs])
  const allActions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs])

  const filtered = useMemo(() => {
    const now = new Date()
    return logs.filter(l => {
      if (search) {
        const name = actorName[l.actor_id ?? ''] ?? ''
        if (!name.toLowerCase().includes(search.toLowerCase())) return false
      }
      if (actionFilter !== 'all' && l.action !== actionFilter) return false
      if (tableFilter !== 'all' && l.target_table !== tableFilter) return false
      if (dateFilter !== 'all') {
        const d = new Date(l.timestamp)
        if (dateFilter === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          if (d < today) return false
        } else if (dateFilter === '7d') {
          if (d < daysAgo(7)) return false
        } else if (dateFilter === '30d') {
          if (d < daysAgo(30)) return false
        }
      }
      return true
    })
  }, [logs, search, actionFilter, tableFilter, dateFilter, actorName])

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-1">Audit Log</h1>
      <p className="text-body-md text-on-surface-variant mb-6">Complete system activity record</p>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="Search by actor name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="Filter by action" className={`${inputCls} sm:w-40`} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {allActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label="Filter by table" className={`${inputCls} sm:w-44`} value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
          <option value="all">All Tables</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Filter by date" className={`${inputCls} sm:w-40`} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <p className="text-body-sm text-on-surface-variant mb-4">Showing {filtered.length} of {logs.length} records</p>

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
              {filtered.map(l => {
                const roleChange = isRoleChange(l)
                return (
                  <tr
                    key={l.id}
                    className={roleChange ? 'bg-amber-50 border-l-4 border-l-amber-400' : 'hover:bg-primary-container/5 transition-colors'}
                  >
                    <td className="py-3 px-6 text-body-sm text-on-surface-variant whitespace-nowrap">{formatTime(l.timestamp)}</td>
                    <td className="py-3 px-6 font-medium">{actorName[l.actor_id ?? ''] ?? '—'}</td>
                    <td className="py-3 px-6">
                      <span className={`text-label-md px-2 py-0.5 rounded-full capitalize ${ACTION_BADGES[l.action] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-on-surface-variant">{l.target_table}</td>
                    <td className="py-3 px-6 text-on-surface-variant text-body-sm font-mono">{l.target_id?.slice(0, 8) ?? '—'}</td>
                    <td className="py-3 px-6 text-body-sm text-on-surface-variant max-w-xs">
                      <span className="truncate block" title={l.details ? JSON.stringify(l.details) : undefined}>
                        {l.details ? JSON.stringify(l.details).slice(0, 60) : '—'}
                        {l.details && JSON.stringify(l.details).length > 60 ? '…' : ''}
                      </span>
                      {roleChange && (
                        <span className="inline-block mt-1 text-label-sm bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Role Change</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
