'use client'

import { useMemo, useState, useTransition } from 'react'
import { createFee, updateFeePayment } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { StudentRow, FeeRow, ClassRow } from '@/lib/types'

export function FeesClient({ fees, students, classes, error }: { fees: FeeRow[]; students: StudentRow[]; classes: ClassRow[]; error?: string }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [addModal, setAddModal] = useState(false)
  const [payModal, setPayModal] = useState<{ fee: FeeRow } | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const studentName = useMemo(() => Object.fromEntries(students.map(s => [s.id, s.name])), [students])
  const filtered = useMemo(() => statusFilter === 'all' ? fees : fees.filter(f => f.status === statusFilter), [fees, statusFilter])

  const summary = useMemo(() => {
    const paid = fees.filter(f => f.status === 'paid').length
    const due = fees.filter(f => f.status === 'due').length
    const overdue = fees.filter(f => f.status === 'overdue').length
    const totalDue = fees.reduce((a, f) => a + (f.amount_due - f.amount_paid), 0)
    return { paid, due, overdue, totalDue }
  }, [fees])

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  const statusColor = (s: string) => s === 'paid' ? 'bg-emerald-100 text-emerald-700' : s === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Fees</h1>
        <button className={btnPrimary} onClick={() => setAddModal(true)}><Icon name="add" /> Create Fee</button>
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">Total Due</span><p className="text-headline-sm font-bold text-red-600">NPR {summary.totalDue.toLocaleString()}</p></div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">Paid</span><p className="text-headline-sm font-bold text-emerald-600">{summary.paid}</p></div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">Due</span><p className="text-headline-sm font-bold text-amber-600">{summary.due}</p></div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">Overdue</span><p className="text-headline-sm font-bold text-red-600">{summary.overdue}</p></div>
      </div>

      <select aria-label="Filter by status" className={`${inputCls} mb-6 sm:w-44`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">All Status</option>
        <option value="paid">Paid</option><option value="due">Due</option><option value="overdue">Overdue</option>
      </select>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="💰" title="No fee records" hint="Create fee records for students." />
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead><tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
              <th className="py-3 px-6 font-medium">Student</th><th className="py-3 px-6 font-medium">Amount Due</th><th className="py-3 px-6 font-medium">Paid</th><th className="py-3 px-6 font-medium">Due Date</th><th className="py-3 px-6 font-medium">Status</th><th className="py-3 px-6 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="py-3 px-6 font-medium">{studentName[f.student_id] ?? '—'}</td>
                  <td className="py-3 px-6">NPR {f.amount_due.toLocaleString()}</td>
                  <td className="py-3 px-6">NPR {f.amount_paid.toLocaleString()}</td>
                  <td className="py-3 px-6 text-on-surface-variant">{new Date(f.due_date).toLocaleDateString()}</td>
                  <td className="py-3 px-6"><span className={`${statusColor(f.status)} text-label-md px-2 py-1 rounded-full capitalize`}>{f.status}</span></td>
                  <td className="py-3 px-6 text-right">
                    {f.status !== 'paid' && <button className={btnOutline} onClick={() => setPayModal({ fee: f })}>Record Payment</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateFeeModal open={addModal} students={students} classes={classes} onClose={() => setAddModal(false)} onSubmit={v => { run(() => createFee(v), 'Fee created'); setAddModal(false) }} />
      {payModal && <PayModal fee={payModal.fee} onClose={() => setPayModal(null)} onSubmit={(amt, receipt) => { run(() => updateFeePayment(payModal.fee.id, amt, receipt), 'Payment recorded'); setPayModal(null) }} />}
    </div>
  )
}

function CreateFeeModal({ open, students, classes, onClose, onSubmit }: { open: boolean; students: StudentRow[]; classes: ClassRow[]; onClose: () => void; onSubmit: (v: any) => void }) {
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const filtered = students.filter(s => !classId || s.class_id === classId)
  return (
    <Modal open={open} onClose={onClose} title="Create Fee Record">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ student_id: studentId, amount_due: +amount, due_date: dueDate }) }} noValidate>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => { setClassId(e.target.value); setStudentId('') }}><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Student"><select className={inputCls} value={studentId} onChange={e => setStudentId(e.target.value)} required><option value="">Select…</option>{filtered.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}</select></Field>
        <Field label="Amount Due (NPR)"><input type="number" min={1} className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} required /></Field>
        <Field label="Due Date"><input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} required /></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Create</button></div>
      </form>
    </Modal>
  )
}

function PayModal({ fee, onClose, onSubmit }: { fee: FeeRow; onClose: () => void; onSubmit: (amt: number, receipt?: string) => void }) {
  const remaining = fee.amount_due - fee.amount_paid
  const [amount, setAmount] = useState(String(remaining))
  const [receipt, setReceipt] = useState('')
  return (
    <Modal open onClose={onClose} title="Record Payment">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit(+amount, receipt || undefined) }} noValidate>
        <p className="text-body-sm text-on-surface-variant">Remaining: NPR {remaining.toLocaleString()}</p>
        <Field label="Amount Paid (NPR)"><input type="number" min={1} max={remaining} className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} required /></Field>
        <Field label="Receipt Number (optional)"><input className={inputCls} value={receipt} onChange={e => setReceipt(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Save Payment</button></div>
      </form>
    </Modal>
  )
}
