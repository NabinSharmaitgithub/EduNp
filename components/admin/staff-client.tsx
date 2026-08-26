'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createStaff, updateStaff, deactivateStaff, createParent, deactivateParent } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, btnDanger, inputCls } from '@/components/ui'
import type { StaffRow, ParentRow, ClassRow, SubjectRow, StaffRole, UserProfile } from '@/lib/types'

type StaffClientProps = {
  staff: StaffRow[]; parents: ParentRow[]; classes: ClassRow[]; subjects: SubjectRow[]
  profile: UserProfile | null; error?: string
}

export function StaffClient({ staff, parents, classes, subjects, profile, error }: StaffClientProps) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'staff' | 'parents'>('staff')
  const [staffModal, setStaffModal] = useState<{ open: boolean; edit?: StaffRow }>({ open: false })
  const [parentModal, setParentModal] = useState(false)
  const [tempPwModal, setTempPwModal] = useState<string | null>(null)

  const callerRole = profile?.role ?? null
  const canManageStaff = callerRole === 'admin' || callerRole === 'principal'
  const canManageParents = callerRole === 'admin'

  function canEditStaffRow(targetRole: StaffRole) {
    if (callerRole === 'admin') return true
    if (callerRole === 'principal') return targetRole === 'teacher' || targetRole === 'helping_staff'
    return false
  }

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
        {((tab === 'staff' && canManageStaff) || (tab === 'parents' && canManageParents)) && (
          <button className={btnPrimary} onClick={() => tab === 'staff' ? setStaffModal({ open: true }) : setParentModal(true)}>
            <Icon name="add" /> {tab === 'staff' ? 'Add Staff' : 'Add Parent'}
          </button>
        )}
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
            <table className="w-full text-left min-w-[740px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-6 font-medium">Name</th>
                  <th className="py-3 px-6 font-medium">Email</th>
                  <th className="py-3 px-6 font-medium">Role</th>
                  <th className="py-3 px-6 font-medium">Designation</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">
                      <Link href={`/admin/staff/${s.id}`} className="hover:text-primary hover:underline">{s.name}</Link>
                    </td>
                    <td className="py-3 px-6 text-on-surface-variant">{s.email}</td>
                    <td className="py-3 px-6"><span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2 py-1 rounded-full capitalize">{s.role.replace('_', ' ')}</span></td>
                    <td className="py-3 px-6 text-on-surface-variant">{s.designation || '—'}</td>
                    <td className="py-3 px-6">
                      <span className={`text-label-md px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <Link aria-label={`View ${s.name}`} href={`/admin/staff/${s.id}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full inline-flex">
                        <Icon name="visibility" />
                      </Link>
                      {canEditStaffRow(s.role as StaffRole) && (
                        <button aria-label={`Edit ${s.name}`} className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full" onClick={() => setStaffModal({ open: true, edit: s })}>
                          <Icon name="edit" />
                        </button>
                      )}
                      {s.status === 'active' && canEditStaffRow(s.role as StaffRole) && (
                        <button aria-label={`Deactivate ${s.name}`} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deactivateStaff(s.id), 'Staff deactivated')}>
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
                  {canManageParents && <th className="py-3 px-6 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {parents.map(p => (
                  <tr key={p.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">{p.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{p.email}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{p.phone ?? '—'}</td>
                    {canManageParents && (
                      <td className="py-3 px-6 text-right">
                        <button aria-label={`Remove ${p.name}`} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deactivateParent(p.id), 'Parent removed')}>
                          <Icon name="person_remove" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <StaffModal open={staffModal.open} edit={staffModal.edit} classes={classes} subjects={subjects} callerRole={profile?.role ?? null} onClose={() => setStaffModal({ open: false })} onSubmit={(v) => {
        startTransition(async () => {
          if (staffModal.edit) {
            const res = await updateStaff(staffModal.edit!.id, v as any)
            if (res.error) toast('error', res.error)
            else toast('success', 'Staff updated')
          } else {
            const res = await createStaff(v as any)
            if (res.error) toast('error', res.error)
            else {
              toast('success', 'Staff created')
              setTempPwModal(res.tempPassword!)
            }
          }
          setStaffModal({ open: false })
        })
      }} />

      <ParentModal open={parentModal} onClose={() => setParentModal(false)} onSubmit={(v) => {
        run(() => createParent(v), 'Parent added')
        setParentModal(false)
      }} />

      {tempPwModal && (
        <Modal open={true} onClose={() => setTempPwModal(null)} title="Staff Created Successfully">
          <div className="flex flex-col gap-4">
            <p className="text-body-md text-on-surface-variant">
              Share this temporary password with the staff member securely. It will be shown only once.
            </p>
            <div className="bg-surface-container-low rounded-lg px-4 py-3 flex items-center gap-3">
              <code className="flex-1 text-title-lg font-mono tracking-wider text-primary select-all">{tempPwModal}</code>
              <button
                className={btnOutline}
                onClick={() => { navigator.clipboard.writeText(tempPwModal); toast('success', 'Password copied') }}
              >
                <Icon name="content_copy" /> Copy
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              The staff member will be prompted to change this password on their first login.
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

/* ---------- Staff Modal (Create / Edit) ---------- */

type StaffModalProps = {
  open: boolean; edit?: StaffRow; classes: ClassRow[]; subjects: SubjectRow[]
  callerRole: UserProfile['role'] | null
  onClose: () => void; onSubmit: (v: Record<string, unknown>) => void
}

function StaffModal({ open, edit, classes, subjects, callerRole, onClose, onSubmit }: StaffModalProps) {
  const isEdit = !!edit
  const [name, setName] = useState(edit?.name ?? '')
  const [email, setEmail] = useState(edit?.email ?? '')
  const [role, setRole] = useState<StaffRole>(edit?.role ?? 'teacher')
  const [dob, setDob] = useState(edit?.date_of_birth ?? '')
  const [gender, setGender] = useState(edit?.gender ?? '')
  const [contact, setContact] = useState(edit?.contact_number ?? '')
  const [emergContact, setEmergContact] = useState(edit?.emergency_contact_number ?? '')
  const [address, setAddress] = useState(edit?.address ?? '')
  const [qualification, setQualification] = useState(edit?.qualification ?? '')
  const [designation, setDesignation] = useState(edit?.designation ?? '')
  const [subjectSpec, setSubjectSpec] = useState(edit?.subject_specialization ?? '')
  const [doj, setDoj] = useState(edit?.date_of_joining ?? '')

  // Teacher-only assignment state (only for create)
  const [classTeacherId, setClassTeacherId] = useState(edit?.role === 'teacher' ? '' : '')
  const [subjectRows, setSubjectRows] = useState<{ subject_id: string; class_id: string }[]>([])

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
        {/* Personal Info */}
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Personal Information</p>
        <Field label="Full Name" error={errors.name}><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email" error={errors.email}><input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isEdit} /></Field>
        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value as StaffRole)} disabled={isEdit}>
            <option value="teacher">Teacher</option>
            <option value="helping_staff">Helping Staff</option>
            {callerRole === 'admin' && <option value="admin">Admin</option>}
            {callerRole === 'admin' && <option value="principal">Principal</option>}
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

        {/* Contact */}
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Number" error={errors.contact}><input className={inputCls} type="tel" value={contact} onChange={e => setContact(e.target.value)} placeholder="7-15 digits" /></Field>
          <Field label="Emergency Contact" error={errors.emergContact}><input className={inputCls} type="tel" value={emergContact} onChange={e => setEmergContact(e.target.value)} placeholder="7-15 digits" /></Field>
        </div>
        <Field label="Address"><textarea className={inputCls} rows={2} value={address} onChange={e => setAddress(e.target.value)} /></Field>

        {/* Professional */}
        <p className="text-label-lg text-on-surface-variant border-b border-outline-variant/30 pb-1">Professional Details</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Qualification"><input className={inputCls} value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. M.Sc, B.Ed" /></Field>
          <Field label="Designation"><input className={inputCls} value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior Teacher" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject Specialization"><input className={inputCls} value={subjectSpec} onChange={e => setSubjectSpec(e.target.value)} placeholder="e.g. Mathematics" /></Field>
          <Field label="Date of Joining"><input className={inputCls} type="date" value={doj} onChange={e => setDoj(e.target.value)} /></Field>
        </div>

        {/* Teacher Assignments (create only) */}
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
                <button type="button" className="text-primary text-body-sm font-medium hover:underline"
                  onClick={() => setSubjectRows([...subjectRows, { subject_id: '', class_id: '' }])}>
                  + Add Row
                </button>
              </div>
              {subjectRows.map((row, i) => (
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <select aria-label={`Subject assignment ${i + 1}`} className={inputCls} value={row.subject_id} onChange={e => {
                      const copy = [...subjectRows]; copy[i] = { ...copy[i], subject_id: e.target.value }; setSubjectRows(copy)
                    }}>
                      <option value="">Subject…</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select aria-label={`Class assignment ${i + 1}`} className={inputCls} value={row.class_id} onChange={e => {
                      const copy = [...subjectRows]; copy[i] = { ...copy[i], class_id: e.target.value }; setSubjectRows(copy)
                    }}>
                      <option value="">Class…</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
                    </select>
                  </div>
                  <button type="button" aria-label="Remove subject assignment" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full shrink-0 mb-0.5"
                    onClick={() => setSubjectRows(subjectRows.filter((_, j) => j !== i))}>
                    <Icon name="close" />
                  </button>
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
