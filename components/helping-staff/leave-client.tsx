'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, ConfirmDialog, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { LeaveRequestRow } from '@/lib/types'

async function submitLeaveRequest(startDate: string, endDate: string, reason: string) {
  const { submitLeaveRequest: fn } = await import('@/app/teacher/actions')
  return fn(startDate, endDate, reason)
}
async function cancelLeaveRequest(id: string) {
  const { cancelLeaveRequest: fn } = await import('@/app/teacher/actions')
  return fn(id)
}

export function HelpingStaffLeaveClient({ leave }: { leave: LeaveRequestRow[] }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [addModal, setAddModal] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  const statusBadge = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    : s === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'

  const statusIcon = (s: string) => s === 'approved' ? '✓' : s === 'rejected' ? '✕' : '⏳'

  const daysBetween = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff === 1 ? '1 day' : `${diff} days`
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">My Leave Requests</h1>
        <button className={btnPrimary} onClick={() => setAddModal(true)}>+ Request Leave</button>
      </div>

      {leave.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📅" title="No leave requests" hint="Submit your first leave request." />
        </div>
      ) : (
        <div className="space-y-3">
          {leave.map(l => (
            <div key={l.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${statusBadge(l.status)} text-label-md px-2.5 py-1 rounded-full capitalize`}>
                      {statusIcon(l.status)} {l.status}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-2">
                    {new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}
                    <span className="ml-2 text-on-surface-variant/70">({daysBetween(l.start_date, l.end_date)})</span>
                  </p>
                  <p className="text-body-md text-on-surface mt-1">{l.reason}</p>
                </div>
                <div className="flex items-center">
                  {l.status === 'pending' && (
                    <button className={btnOutline + ' text-sm'} onClick={() => setConfirmCancel(l.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveModal open={addModal} onClose={() => setAddModal(false)} onSubmit={(start, end, reason) => {
        run(() => submitLeaveRequest(start, end, reason), 'Leave request submitted')
        setAddModal(false)
      }} />

      <ConfirmDialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => { if (confirmCancel) run(() => cancelLeaveRequest(confirmCancel), 'Leave request cancelled'); setConfirmCancel(null) }}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request?"
        confirmLabel="Cancel Request"
        danger
      />
    </div>
  )
}

function LeaveModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (start: string, end: string, reason: string) => void }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!start || !end) { setError('Both dates are required'); return }
    if (new Date(end) < new Date(start)) { setError('End date cannot be before start date'); return }
    if (!reason.trim()) { setError('Reason is required'); return }
    onSubmit(start, end, reason.trim())
    setStart(''); setEnd(''); setReason('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Request Leave">
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><input type="date" className={inputCls} value={start} onChange={e => setStart(e.target.value)} required /></Field>
          <Field label="End Date"><input type="date" className={inputCls} value={end} onChange={e => setEnd(e.target.value)} required /></Field>
        </div>
        <Field label="Reason" error={error}><textarea className={inputCls + ' min-h-[80px]'} value={reason} onChange={e => setReason(e.target.value)} required placeholder="Why are you requesting leave?" /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>Submit</button>
        </div>
      </form>
    </Modal>
  )
}
