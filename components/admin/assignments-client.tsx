'use client'

import { useState, useTransition } from 'react'
import { assignClassTeacher, removeClassTeacher, assignSubjectTeacher, removeSubjectTeacher } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { StaffRow, ClassRow, SubjectRow, TeacherClassAssignment, TeacherSubjectAssignment } from '@/lib/types'

export function AssignmentsClient({ teachers, classes, subjects, classAssignments, subjectAssignments, error }: {
  teachers: StaffRow[]; classes: ClassRow[]; subjects: SubjectRow[]
  classAssignments: TeacherClassAssignment[]; subjectAssignments: TeacherSubjectAssignment[]; error?: string
}) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [classModal, setClassModal] = useState(false)
  const [subjectModal, setSubjectModal] = useState(false)
  const teacherName = (id: string) => teachers.find(t => t.id === id)?.name ?? '—'
  const className = (id: string) => classes.find(c => c.id === id)?.name ?? '—'
  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? '—'

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast('error', res.error)
      else toast('success', okMsg)
    })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Teacher Assignments</h1>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-sm font-bold">Class Teachers</h2>
          <button className={btnPrimary} onClick={() => setClassModal(true)}><Icon name="add" /> Assign</button>
        </div>
        {classAssignments.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
            <EmptyState icon="🏫" title="No class assignments" hint="Assign teachers to classes above." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classAssignments.map(a => (
              <div key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{className(a.class_id)}</p>
                  <p className="text-body-sm text-on-surface-variant">{teacherName(a.teacher_id)}</p>
                </div>
                <button aria-label="Remove class teacher" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => removeClassTeacher(a.class_id), 'Removed')}>
                  <Icon name="close" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-headline-sm font-bold">Subject Teachers</h2>
          <button className={btnPrimary} onClick={() => setSubjectModal(true)}><Icon name="add" /> Assign</button>
        </div>
        {subjectAssignments.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
            <EmptyState icon="📚" title="No subject assignments" hint="Assign teachers to subjects above." />
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-6 font-medium">Teacher</th>
                  <th className="py-3 px-6 font-medium">Subject</th>
                  <th className="py-3 px-6 font-medium">Class</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {subjectAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">{teacherName(a.teacher_id)}</td>
                    <td className="py-3 px-6">{subjectName(a.subject_id)}</td>
                    <td className="py-3 px-6">{className(a.class_id)}</td>
                    <td className="py-3 px-6 text-right">
                      <button aria-label="Remove subject teacher" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => removeSubjectTeacher(a.id), 'Removed')}>
                        <Icon name="close" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ClassAssignModal open={classModal} teachers={teachers} classes={classes} onClose={() => setClassModal(false)} onSubmit={(tid, cid) => {
        run(() => assignClassTeacher(tid, cid), 'Class teacher assigned')
        setClassModal(false)
      }} />

      <SubjectAssignModal open={subjectModal} teachers={teachers} classes={classes} subjects={subjects} onClose={() => setSubjectModal(false)} onSubmit={(tid, sid, cid) => {
        run(() => assignSubjectTeacher(tid, sid, cid), 'Subject teacher assigned')
        setSubjectModal(false)
      }} />
    </div>
  )
}

function ClassAssignModal({ open, teachers, classes, onClose, onSubmit }: { open: boolean; teachers: StaffRow[]; classes: ClassRow[]; onClose: () => void; onSubmit: (t: string, c: string) => void }) {
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Assign Class Teacher">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); if (teacherId && classId) onSubmit(teacherId, classId) }} noValidate>
        <Field label="Teacher"><select className={inputCls} value={teacherId} onChange={e => setTeacherId(e.target.value)} required><option value="">Select…</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Assign</button></div>
      </form>
    </Modal>
  )
}

function SubjectAssignModal({ open, teachers, classes, subjects, onClose, onSubmit }: { open: boolean; teachers: StaffRow[]; classes: ClassRow[]; subjects: SubjectRow[]; onClose: () => void; onSubmit: (t: string, s: string, c: string) => void }) {
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Assign Subject Teacher">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); if (teacherId && subjectId && classId) onSubmit(teacherId, subjectId, classId) }} noValidate>
        <Field label="Teacher"><select className={inputCls} value={teacherId} onChange={e => setTeacherId(e.target.value)} required><option value="">Select…</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Subject"><select className={inputCls} value={subjectId} onChange={e => setSubjectId(e.target.value)} required><option value="">Select…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Assign</button></div>
      </form>
    </Modal>
  )
}
