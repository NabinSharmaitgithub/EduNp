'use client'

import { useState, useTransition } from 'react'
import { submitLeaveRequest, cancelLeaveRequest } from '@/app/teacher/actions'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { LeaveRequestRow } from '@/lib/types'

export function TeacherLeaveClient({ leave }: { leave: LeaveRequestRow[] }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [addModal, setAddModal] = useState(false)

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  const statusColor = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">My Leave Requests</h1>
        <button className={btnPrimary} onClick={() => setAddModal(true)}>Request Leave</button>
      </div>

      {leave.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📅" title="No leave requests" hint="Submit your first leave request." />
        </div>
      ) : (
        <div className="space-y-3">
          {leave.map(l => (
            <div key={l.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-body-sm text-on-surface-variant">{new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}</p>
                <p className="text-body-md text-on-surface mt-1">{l.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`${statusColor(l.status)} text-label-md px-3 py-1 rounded-full capitalize`}>{l.status}</span>
                {l.status === 'pending' && (
                  <button className={btnOutline} onClick={() => run(() => cancelLeaveRequest(l.id), 'Cancelled')}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveModal open={addModal} onClose={() => setAddModal(false)} onSubmit={(start, end, reason) => {
        run(() => submitLeaveRequest(start, end, reason), 'Leave request submitted')
        setAddModal(false)
      }} />
    </div>
  )
}

function LeaveModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (start: string, end: string, reason: string) => void }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Request Leave">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit(start, end, reason) }} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><input type="date" className={inputCls} value={start} onChange={e => setStart(e.target.value)} required /></Field>
          <Field label="End Date"><input type="date" className={inputCls} value={end} onChange={e => setEnd(e.target.value)} required /></Field>
        </div>
        <Field label="Reason"><textarea className={inputCls + ' min-h-[80px]'} value={reason} onChange={e => setReason(e.target.value)} required /></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Submit</button></div>
      </form>
    </Modal>
  )
}
