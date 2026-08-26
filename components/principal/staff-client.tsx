'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { createStaff, updateStaff, deactivateStaff } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, btnDanger, inputCls, ConfirmDialog } from '@/components/ui'
import type { StaffRow, ClassRow, SubjectRow } from '@/lib/types'

type Props = { staff: StaffRow[]; classes: ClassRow[]; subjects: SubjectRow[]; error?: string }

const ROLE_BADGE: Record<string, string> = {
  teacher: 'bg-emerald-100 text-emerald-700',
  helping_staff: 'bg-violet-100 text-violet-700',
}

export function PrincipalStaffClient({ staff, classes, subjects, error }: Props) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffModal, setStaffModal] = useState<{ open: boolean; edit?: StaffRow }>({ open: false })
  const [tempPw, setTempPw] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<StaffRow | null>(null)

  const filtered = useMemo(() =>
    staff.filter(s => (roleFilter === 'all' || s.role === roleFilter) && (statusFilter === 'all' || s.status === statusFilter)),
    [staff, roleFilter, statusFilter]
  )

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast('error', res.error)
      else toast('success', okMsg)
    })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-headline-lg">Staff Management</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage teachers and helping staff</p>
        </div>
        <button className={btnPrimary} onClick={() => setStaffModal({ open: true })}><Icon name="add" /> Add Staff</button>
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <select aria-label="Filter by role" className={`${inputCls} sm:w-44`} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="teacher">Teacher</option>
          <option value="helping_staff">Helping Staff</option>
        </select>
        <select aria-label="Filter by status" className={`${inputCls} sm:w-40`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="removed">Removed</option>
        </select>
        <span className="text-body-sm text-on-surface-variant">Showing {filtered.length} of {staff.length} staff</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="people" title="No staff found" hint="Adjust your filters or add new staff." />
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Role</th>
                <th className="py-3 px-6 font-medium">Designation</th>
                <th className="py-3 px-6 font-medium">Contact</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="py-3 px-6">
                    <Link href={`/admin/staff/${s.id}`} className="font-medium hover:text-primary hover:underline">{s.name}</Link>
                  </td>
                  <td className="py-3 px-6"><span className={`text-label-md px-2 py-1 rounded-full capitalize ${ROLE_BADGE[s.role] ?? ''}`}>{s.role.replace('_', ' ')}</span></td>
                  <td className="py-3 px-6 text-on-surface-variant">{s.designation || '—'}</td>
                  <td className="py-3 px-6 text-on-surface-variant">{s.contact_number || '—'}</td>
                  <td className="py-3 px-6">
                    <span className={`text-label-md px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <Link aria-label={`View ${s.name}`} href={`/admin/staff/${s.id}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full inline-flex">
                      <Icon name="visibility" />
                    </Link>
                    <button aria-label={`Edit ${s.name}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full" onClick={() => setStaffModal({ open: true, edit: s })}>
                      <Icon name="edit" />
                    </button>
                    {s.status === 'active' && (
                      <button aria-label={`Remove ${s.name}`} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => setConfirmTarget(s)}>
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

      <StaffModal open={staffModal.open} edit={staffModal.edit} classes={classes} subjects={subjects} onClose={() => setStaffModal({ open: false })} onSubmit={(v) => {
        startTransition(async () => {
          if (staffModal.edit) {
            const res = await updateStaff(staffModal.edit!.id, v as any)
            if (res.error) toast('error', res.error)
            else toast('success', 'Staff updated')
            setStaffModal({ open: false })
          } else {
            const res = await createStaff(v as any)
            if (res.error) {
              toast('error', res.error)
              setStaffModal({ open: false })
            } else if (res.temporaryPassword) {
              setStaffModal({ open: false })
              setTempPw(res.temporaryPassword)
            } else {
              toast('error', 'Staff created but password could not be generated.')
              setStaffModal({ open: false })
            }
          }
        })
      }} />

      {confirmTarget && (
        <ConfirmDialog open={true} onClose={() => setConfirmTarget(null)} onConfirm={() => {
          run(() => deactivateStaff(confirmTarget.id), 'Staff member removed')
          setConfirmTarget(null)
        }} title="Remove Staff Member" message={`This will deactivate ${confirmTarget.name}'s account. Continue?`} confirmLabel="Remove" danger />
      )}

      {tempPw && (
        <Modal open={true} onClose={() => setTempPw(null)} title="Staff Created Successfully">
          <div className="flex flex-col gap-4">
            <p className="text-body-md text-on-surface-variant">Share this temporary password securely. It will be shown only once.</p>
            <div className="bg-surface-container-low rounded-lg px-4 py-3 flex items-center gap-3">
              <code className="flex-1 text-title-lg font-mono tracking-wider text-primary select-all">{tempPw}</code>
              <button className={btnOutline} onClick={() => { navigator.clipboard.writeText(tempPw); toast('success', 'Password copied') }}>
                <Icon name="content_copy" /> Copy
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">They will be prompted to change this on first login.</p>
            <div className="flex justify-end"><button className={btnPrimary} onClick={() => setTempPw(null)}>Done</button></div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StaffModal({ open, edit, classes, subjects, onClose, onSubmit }: {
  open: boolean; edit?: StaffRow; classes: ClassRow[]; subjects: SubjectRow[]
  onClose: () => void; onSubmit: (v: Record<string, unknown>) => void
}) {
  const isEdit = !!edit
  const [name, setName] = useState(edit?.name ?? '')
  const [email, setEmail] = useState(edit?.email ?? '')
  const [role, setRole] = useState<'teacher' | 'helping_staff'>(edit?.role as 'teacher' | 'helping_staff' ?? 'teacher')
  const [dob, setDob] = useState(edit?.date_of_birth ?? '')
  const [gender, setGender] = useState(edit?.gender ?? '')
  const [contact, setContact] = useState(edit?.contact_number ?? '')
  const [emergContact, setEmergContact] = useState(edit?.emergency_contact_number ?? '')
  const [address, setAddress] = useState(edit?.address ?? '')
  const [qualification, setQualification] = useState(edit?.qualification ?? '')
  const [designation, setDesignation] = useState(edit?.designation ?? '')
  const [subjectSpec, setSubjectSpec] = useState(edit?.subject_specialization ?? '')
  const [doj, setDoj] = useState(edit?.date_of_joining ?? '')
  const [classTeacherId, setClassTeacherId] = useState('')
  const [subjectRows, setSubjectRows] = useState<{ subject_id: string; class_id: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    if (!email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (contact && !/^\d{7,15}$/.test(contact)) e.contact = '7-15 digits'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    const v: Record<string, unknown> = {
      name: name.trim(), email: email.trim(), role,
      date_of_birth: dob || undefined, gender: gender || undefined,
      contact_number: contact || undefined, emergency_contact_number: emergContact || undefined,
      address: address || undefined, qualification: qualification || undefined,
      designation: designation || undefined, subject_specialization: subjectSpec || undefined,
      date_of_joining: doj || undefined,
    }
    if (!isEdit && role === 'teacher') {
      if (classTeacherId) v.teacher_class_id = classTeacherId
      if (subjectRows.length) v.teacher_subjects = subjectRows
    }
    onSubmit(v)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Staff' : 'Add Staff'}>
      <form className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Personal Information</p>
        <Field label="Full Name" error={errors.name}><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email" error={errors.email}><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isEdit} /></Field>
        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value as 'teacher' | 'helping_staff')} disabled={isEdit}>
            <option value="teacher">Teacher</option>
            <option value="helping_staff">Helping Staff</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of Birth"><input className={inputCls} type="date" value={dob} onChange={e => setDob(e.target.value)} /></Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </Field>
        </div>
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Number" error={errors.contact}><input className={inputCls} type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="7-15 digits" /></Field>
          <Field label="Emergency Contact"><input className={inputCls} type="tel" value={emergContact} onChange={e => setEmergContact(e.target.value)} placeholder="7-15 digits" /></Field>
        </div>
        <Field label="Address"><textarea className={inputCls} rows={2} value={address} onChange={e => setAddress(e.target.value)} /></Field>
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Professional Details</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Qualification"><input className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)} /></Field>
          <Field label="Designation"><input className={inputCls} value={designation} onChange={e => setDesignation(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject Specialization"><input className={inputCls} value={subjectSpec} onChange={e => setSubjectSpec(e.target.value)} /></Field>
          <Field label="Date of Joining"><input className={inputCls} type="date" value={doj} onChange={e => setDoj(e.target.value)} /></Field>
        </div>
        {!isEdit && role === 'teacher' && (
          <>
            <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Teacher Assignments</p>
            <Field label="Assign as Class Teacher (optional)">
              <select className={inputCls} value={classTeacherId} onChange={e => setClassTeacherId(e.target.value)}>
                <option value="">None</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
              </select>
            </Field>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-label-md text-on-surface">Assign Subjects</span>
                <button type="button" className="text-primary text-body-sm font-medium hover:underline" onClick={() => setSubjectRows([...subjectRows, { subject_id: '', class_id: '' }])}>+ Add Row</button>
              </div>
              {subjectRows.map((row, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <select aria-label={`Subject ${i + 1}`} className={inputCls} value={row.subject_id} onChange={e => { const c = [...subjectRows]; c[i] = { ...c[i], subject_id: e.target.value }; setSubjectRows(c) }}>
                      <option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select aria-label={`Class ${i + 1}`} className={inputCls} value={row.class_id} onChange={e => { const c = [...subjectRows]; c[i] = { ...c[i], class_id: e.target.value }; setSubjectRows(c) }}>
                      <option value="">Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
                    </select>
                  </div>
                  <button type="button" aria-label="Remove" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full shrink-0 mb-0.5" onClick={() => setSubjectRows(subjectRows.filter((_, j) => j !== i))}><Icon name="close" /></button>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant/30">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{isEdit ? 'Save Changes' : 'Create Staff'}</button>
        </div>
      </form>
    </Modal>
  )
}
