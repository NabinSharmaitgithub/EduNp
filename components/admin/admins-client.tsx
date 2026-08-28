'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createStaff, updateStaff, deactivateStaff } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, btnDanger, inputCls, Avatar, ConfirmDialog } from '@/components/ui'
import { PhotoField } from '@/components/photo-field'
import type { StaffRow, ClassRow, SubjectRow, StaffRole } from '@/lib/types'

type Props = { admins: StaffRow[]; error?: string }

export function AdminsClient({ admins, error }: Props) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [staffModal, setStaffModal] = useState<{ open: boolean; edit?: StaffRow }>({ open: false })
  const [tempPwModal, setTempPwModal] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<StaffRow | null>(null)

  const totalAdmins = admins.filter(a => a.role === 'admin').length
  const totalPrincipals = admins.filter(a => a.role === 'principal').length
  const totalActive = admins.filter(a => a.status === 'active').length

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast('error', res.error)
      else toast('success', okMsg)
      setConfirmRemove(null)
    })
  }

  const stats = [
    { label: 'Total Admins', value: totalAdmins },
    { label: 'Total Principals', value: totalPrincipals },
    { label: 'Active', value: totalActive },
  ]

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Admins & Principals</h1>
        <button className={btnPrimary} onClick={() => setStaffModal({ open: true })}>
          <Icon name="add" /> Add Admin/Principal
        </button>
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
            <p className="text-body-sm text-on-surface-variant">{s.label}</p>
            <p className="text-headline-sm mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {admins.length === 0 ? (
        <EmptyState icon="👥" title="No admins yet" hint="Add administrators or principals to manage your school." />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[780px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Photo</th>
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Email</th>
                <th className="py-3 px-6 font-medium">Role</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium">Joined</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="py-3 px-6"><Avatar name={a.name} /></td>
                  <td className="py-3 px-6 font-medium">
                    <Link href={`/admin/staff/${a.id}`} className="hover:text-primary hover:underline">{a.name}</Link>
                  </td>
                  <td className="py-3 px-6 text-on-surface-variant">{a.email}</td>
                  <td className="py-3 px-6">
                    <span className={`text-label-md px-2 py-1 rounded-full capitalize ${a.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {a.role}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`text-label-md px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-on-surface-variant text-body-sm">
                    {a.date_of_joining ? new Date(a.date_of_joining).toLocaleDateString() : a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <Link aria-label={`View ${a.name}`} href={`/admin/staff/${a.id}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full inline-flex">
                      <Icon name="visibility" />
                    </Link>
                    <button aria-label={`Edit ${a.name}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full" onClick={() => setStaffModal({ open: true, edit: a })}>
                      <Icon name="edit" />
                    </button>
                    {a.status === 'active' && (
                      <button aria-label={`Remove ${a.name}`} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => setConfirmRemove(a)}>
                        <Icon name="person_remove" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => { if (confirmRemove) run(() => deactivateStaff(confirmRemove.id), 'Account deactivated') }}
        title="Remove Account"
        message="This will deactivate their account and they will lose access. Continue?"
        confirmLabel="Remove"
        danger
      />

      <StaffModal open={staffModal.open} edit={staffModal.edit} onClose={() => setStaffModal({ open: false })} onSubmit={(v) => {
        startTransition(async () => {
          if (staffModal.edit) {
            const res = await updateStaff(staffModal.edit!.id, v as any)
            if (res.error) toast('error', res.error)
            else toast('success', 'Admin updated')
            setStaffModal({ open: false })
          } else {
            const res = await createStaff(v as any)
            if (res.error) {
              toast('error', res.error)
              setStaffModal({ open: false })
            } else if (res.temporaryPassword) {
              setStaffModal({ open: false })
              setTempPwModal(res.temporaryPassword)
            } else {
              toast('error', 'Staff created but password could not be generated. Ask the user to reset their password.')
              setStaffModal({ open: false })
            }
          }
        })
      }} />

      {tempPwModal && (
        <Modal open={true} onClose={() => setTempPwModal(null)} title="Admin Created Successfully">
          <div className="flex flex-col gap-4">
            <p className="text-body-md text-on-surface-variant">
              Share this temporary password securely. It will be shown only once.
            </p>
            <div className="bg-surface-container-low rounded-lg px-4 py-3 flex items-center gap-3">
              <code className="flex-1 text-title-lg font-mono tracking-wider text-primary select-all">{tempPwModal}</code>
              <button className={btnOutline} onClick={() => { navigator.clipboard.writeText(tempPwModal); toast('success', 'Password copied') }}>
                <Icon name="content_copy" /> Copy
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              They will be prompted to change this password on first login.
            </p>
            <div className="flex justify-end">
              <button className={btnPrimary} onClick={() => setTempPwModal(null)}>Done</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StaffModal({ open, edit, onClose, onSubmit }: {
  open: boolean; edit?: StaffRow; onClose: () => void; onSubmit: (v: Record<string, unknown>) => void
}) {
  const isEdit = !!edit
  const [name, setName] = useState(edit?.name ?? '')
  const [email, setEmail] = useState(edit?.email ?? '')
  const [role, setRole] = useState<StaffRole>(edit?.role ?? 'admin')
  const [dob, setDob] = useState(edit?.date_of_birth ?? '')
  const [gender, setGender] = useState(edit?.gender ?? '')
  const [contact, setContact] = useState(edit?.contact_number ?? '')
  const [emergContact, setEmergContact] = useState(edit?.emergency_contact_number ?? '')
  const [address, setAddress] = useState(edit?.address ?? '')
  const [qualification, setQualification] = useState(edit?.qualification ?? '')
  const [designation, setDesignation] = useState(edit?.designation ?? '')
  const [doj, setDoj] = useState(edit?.date_of_joining ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(edit?.photo_url ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    if (!email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (contact && !/^\d{7,15}$/.test(contact)) e.contact = '7-15 digits'
    if (emergContact && !/^\d{7,15}$/.test(emergContact)) e.emergContact = '7-15 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    onSubmit({
      name: name.trim(), email: email.trim(), role,
      date_of_birth: dob || undefined, gender: gender || undefined,
      contact_number: contact || undefined, emergency_contact_number: emergContact || undefined,
      address: address || undefined, qualification: qualification || undefined,
      designation: designation || undefined, date_of_joining: doj || undefined,
      photo_url: photoUrl,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Admin/Principal' : 'Add Admin/Principal'}>
      <form className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Personal Information</p>
        <Field label="Full Name" error={errors.name}><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email" error={errors.email}><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isEdit} /></Field>
        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value as StaffRole)} disabled={isEdit}>
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of Birth"><input className={inputCls} type="date" value={dob} onChange={e => setDob(e.target.value)} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        <PhotoField value={photoUrl} onChange={setPhotoUrl} />

        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Number" error={errors.contact}><input className={inputCls} type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="7-15 digits" /></Field>
          <Field label="Emergency Contact" error={errors.emergContact}><input className={inputCls} type="tel" value={emergContact} onChange={e => setEmergContact(e.target.value)} placeholder="7-15 digits" /></Field>
        </div>
        <Field label="Address"><textarea className={inputCls} rows={2} value={address} onChange={e => setAddress(e.target.value)} /></Field>

        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Professional Details</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Qualification"><input className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. M.Sc, B.Ed" /></Field>
          <Field label="Designation"><input className={inputCls} value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Vice Principal" /></Field>
        </div>
        <Field label="Date of Joining"><input className={inputCls} type="date" value={doj} onChange={e => setDoj(e.target.value)} /></Field>

        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant/30">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{isEdit ? 'Save Changes' : 'Create Admin'}</button>
        </div>
      </form>
    </Modal>
  )
}
