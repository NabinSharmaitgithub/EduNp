'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateTeacherAssignments } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { Avatar, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { StaffRow, ClassRow, SubjectRow, TeacherClassAssignment, TeacherSubjectAssignment } from '@/lib/types'

type Props = {
  staff: StaffRow; classes: ClassRow[]; subjects: SubjectRow[]
  classAssign: TeacherClassAssignment[] | null; subjectAssign: TeacherSubjectAssignment[] | null
}

export function StaffProfileClient({ staff, classes, subjects, classAssign, subjectAssign }: Props) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [editModal, setEditModal] = useState(false)

  const className = (id: string) => classes.find(c => c.id === id)
  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? '—'

  const currentClassTeacher = classAssign?.[0] ? className(classAssign[0].class_id) : null
  const currentSubjects = subjectAssign ?? []

  function handleAssignmentSave(classId: string | null, subs: { subject_id: string; class_id: string }[]) {
    startTransition(async () => {
      const res = await updateTeacherAssignments(staff.id, classId, subs)
      if (res.error) toast('error', res.error)
      else { toast('success', 'Assignments updated'); setEditModal(false) }
    })
  }

  const infoFields: { label: string; value: string | null }[] = [
    { label: 'Email', value: staff.email },
    { label: 'Role', value: staff.role?.replace('_', ' ') },
    { label: 'Designation', value: staff.designation },
    { label: 'Date of Birth', value: staff.date_of_birth },
    { label: 'Gender', value: staff.gender },
    { label: 'Contact Number', value: staff.contact_number },
    { label: 'Emergency Contact', value: staff.emergency_contact_number },
    { label: 'Address', value: staff.address },
    { label: 'Qualification', value: staff.qualification },
    { label: 'Subject Specialization', value: staff.subject_specialization },
    { label: 'Date of Joining', value: staff.date_of_joining },
    { label: 'Status', value: staff.status },
  ]

  return (
    <div className="max-w-content mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/staff" className="text-on-surface-variant hover:text-primary">
          <Icon name="arrow_back" />
        </Link>
        <Avatar name={staff.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-headline-lg">{staff.name}</h1>
          <p className="text-body-md text-on-surface-variant capitalize">{staff.role?.replace('_', ' ')}</p>
        </div>
        {staff.role === 'teacher' && (
          <button className={btnOutline} onClick={() => setEditModal(true)}>
            <Icon name="edit" /> Edit Assignments
          </button>
        )}
      </div>

      {/* Personal Details */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30">
          <h3 className="text-headline-sm font-bold">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/30">
          <div className="divide-y divide-outline-variant/30">
            {infoFields.slice(0, Math.ceil(infoFields.length / 2)).map(f => (
              <div key={f.label} className="flex justify-between items-center px-6 py-3.5">
                <span className="text-body-sm text-on-surface-variant">{f.label}</span>
                <span className="text-body-md font-medium text-on-surface text-right capitalize">{f.value || '—'}</span>
              </div>
            ))}
          </div>
          <div className="divide-y divide-outline-variant/30">
            {infoFields.slice(Math.ceil(infoFields.length / 2)).map(f => (
              <div key={f.label} className="flex justify-between items-center px-6 py-3.5">
                <span className="text-body-sm text-on-surface-variant">{f.label}</span>
                <span className="text-body-md font-medium text-on-surface text-right capitalize">{f.value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Assignments */}
      {staff.role === 'teacher' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30">
            <h3 className="text-headline-sm font-bold">Teaching Assignments</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="text-body-sm text-on-surface-variant">Class Teacher of:</span>
              <p className="text-title-lg font-medium mt-1">
                {currentClassTeacher ? `${currentClassTeacher.name}${currentClassTeacher.section ? ' — ' + currentClassTeacher.section : ''}` : 'Not assigned'}
              </p>
            </div>
            {currentSubjects.length > 0 && (
              <div>
                <span className="text-body-sm text-on-surface-variant">Subjects Taught:</span>
                <div className="mt-2 bg-surface-container-low rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                        <th className="py-2.5 px-4 text-label-md font-medium">Subject</th>
                        <th className="py-2.5 px-4 text-label-md font-medium">Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {currentSubjects.map(a => (
                        <tr key={a.id}>
                          <td className="py-2.5 px-4 text-body-md">{subjectName(a.subject_id)}</td>
                          <td className="py-2.5 px-4 text-body-md">{className(a.class_id)?.name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {currentSubjects.length === 0 && !currentClassTeacher && (
              <p className="text-body-sm text-on-surface-variant">No assignments yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Assignment Edit Modal */}
      {staff.role === 'teacher' && (
        <AssignmentEditModal
          open={editModal} onClose={() => setEditModal(false)} classes={classes} subjects={subjects}
          currentClassTeacher={currentClassTeacher?.id ?? null}
          currentSubjects={currentSubjects}
          onSave={handleAssignmentSave} pending={pending}
        />
      )}
    </div>
  )
}

function AssignmentEditModal({ open, onClose, classes, subjects, currentClassTeacher, currentSubjects, onSave, pending }: {
  open: boolean; onClose: () => void; classes: ClassRow[]; subjects: SubjectRow[]
  currentClassTeacher: string | null
  currentSubjects: TeacherSubjectAssignment[]
  onSave: (classId: string | null, subs: { subject_id: string; class_id: string }[]) => void
  pending: boolean
}) {
  const [classId, setClassId] = useState(currentClassTeacher ?? '')
  const [rows, setRows] = useState<{ subject_id: string; class_id: string }[]>(
    currentSubjects.map(a => ({ subject_id: a.subject_id, class_id: a.class_id }))
  )

  return (
    <Modal open={open} onClose={onClose} title="Edit Assignments">
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <Field label="Class Teacher Of">
          <select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">None</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
          </select>
        </Field>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-label-md text-on-surface">Subject Assignments</span>
            <button type="button" className="text-primary text-body-sm font-medium hover:underline"
              onClick={() => setRows([...rows, { subject_id: '', class_id: '' }])}>
              + Add Row
            </button>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2 items-end">
              <div className="flex-1">
                <select className={inputCls} value={row.subject_id} onChange={e => {
                  const copy = [...rows]; copy[i] = { ...copy[i], subject_id: e.target.value }; setRows(copy)
                }}>
                  <option value="">Subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <select className={inputCls} value={row.class_id} onChange={e => {
                  const copy = [...rows]; copy[i] = { ...copy[i], class_id: e.target.value }; setRows(copy)
                }}>
                  <option value="">Class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
                </select>
              </div>
              <button type="button" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full shrink-0 mb-0.5"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant/30">
          <button className={btnOutline} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={pending} onClick={() => onSave(classId || null, rows)}>
            {pending && <Spinner />} Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
