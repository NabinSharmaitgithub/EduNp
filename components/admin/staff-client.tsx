'use client'

import { useState, useTransition } from 'react'
import { createStaff, updateStaff, deactivateStaff, createParent } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { StaffRow, ParentRow } from '@/lib/types'

export function StaffClient({ staff, parents, error }: { staff: StaffRow[]; parents: ParentRow[]; error?: string }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'staff' | 'parents'>('staff')
  const [staffModal, setStaffModal] = useState<{ open: boolean; edit?: StaffRow }>({ open: false })
  const [parentModal, setParentModal] = useState(false)

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast('error', res.error)
      else toast('success', okMsg)
    })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Staff & Parents</h1>
        <button className={btnPrimary} onClick={() => tab === 'staff' ? setStaffModal({ open: true }) : setParentModal(true)}>
          <Icon name="add" /> {tab === 'staff' ? 'Add Staff' : 'Add Parent'}
        </button>
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="flex gap-6 border-b border-outline-variant mb-6">
        {(['staff', 'parents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 -mb-px text-title-lg capitalize transition-colors ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            {t === 'staff' ? `Staff (${staff.length})` : `Parents (${parents.length})`}
          </button>
        ))}
      </div>

      {tab === 'staff' ? (
        staff.length === 0 ? <EmptyState icon="👥" title="No staff yet" hint="Add teachers and staff members." /> : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-6 font-medium">Name</th>
                  <th className="py-3 px-6 font-medium">Email</th>
                  <th className="py-3 px-6 font-medium">Role</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">{s.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{s.email}</td>
                    <td className="py-3 px-6"><span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2 py-1 rounded-full capitalize">{s.role}</span></td>
                    <td className="py-3 px-6">
                      <span className={`text-label-md px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full" onClick={() => setStaffModal({ open: true, edit: s })}>
                        <Icon name="edit" />
                      </button>
                      {s.status === 'active' && (
                        <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deactivateStaff(s.id), 'Staff deactivated')}>
                          <Icon name="person_remove" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        parents.length === 0 ? <EmptyState icon="👨‍👩‍👧" title="No parents yet" hint="Add parent accounts to link with students." /> : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-6 font-medium">Name</th>
                  <th className="py-3 px-6 font-medium">Email</th>
                  <th className="py-3 px-6 font-medium">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {parents.map(p => (
                  <tr key={p.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">{p.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{p.email}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{p.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <StaffModal open={staffModal.open} edit={staffModal.edit} onClose={() => setStaffModal({ open: false })} onSubmit={(v) => {
        run(() => staffModal.edit ? updateStaff(staffModal.edit!.id, v) : createStaff(v as any), staffModal.edit ? 'Staff updated' : 'Staff added')
        setStaffModal({ open: false })
      }} />

      <ParentModal open={parentModal} onClose={() => setParentModal(false)} onSubmit={(v) => {
        run(() => createParent(v), 'Parent added')
        setParentModal(false)
      }} />
    </div>
  )
}

function StaffModal({ open, edit, onClose, onSubmit }: { open: boolean; edit?: StaffRow; onClose: () => void; onSubmit: (v: any) => void }) {
  const [name, setName] = useState(edit?.name ?? '')
  const [email, setEmail] = useState(edit?.email ?? '')
  const [role, setRole] = useState(edit?.role ?? 'teacher')

  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Edit Staff' : 'Add Staff'}>
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ name, email, role }) }} noValidate>
        <Field label="Name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value as 'principal' | 'teacher')}>
            <option value="teacher">Teacher</option>
            <option value="principal">Principal</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{edit ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  )
}

function ParentModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (v: any) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Add Parent">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ name, email, phone: phone || undefined }) }} noValidate>
        <Field label="Name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
        <Field label="Phone"><input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>Add Parent</button>
        </div>
      </form>
    </Modal>
  )
}
