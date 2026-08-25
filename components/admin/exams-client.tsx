'use client'

import { useMemo, useState, useTransition } from 'react'
import { createExam, deleteExam, assignExamDuty, removeExamDuty } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { ExamRow, ExamDutyRow, StaffRow, ClassRow } from '@/lib/types'

export function ExamsClient({ exams, duties, teachers, classes, error }: {
  exams: ExamRow[]; duties: ExamDutyRow[]; teachers: StaffRow[]; classes: ClassRow[]; error?: string
}) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [addModal, setAddModal] = useState(false)
  const [dutyModal, setDutyModal] = useState<ExamRow | null>(null)
  const tName = useMemo(() => Object.fromEntries(teachers.map(t => [t.id, t.name])), [teachers])
  const cName = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Exams</h1>
        <button className={btnPrimary} onClick={() => setAddModal(true)}><Icon name="add" /> New Exam</button>
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      {exams.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📝" title="No exams yet" hint="Create your first exam." />
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map(ex => {
            const exDuties = duties.filter(d => d.exam_id === ex.id)
            return (
              <div key={ex.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-title-lg">{ex.name}</h3>
                    <p className="text-body-sm text-on-surface-variant">{cName[ex.class_id] ?? '—'} · {new Date(ex.start_date).toLocaleDateString()} – {new Date(ex.end_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={btnOutline} onClick={() => setDutyModal(ex)}>Duties ({exDuties.length})</button>
                    <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deleteExam(ex.id), 'Exam deleted')}><Icon name="delete" /></button>
                  </div>
                </div>
                {exDuties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exDuties.map(d => (
                      <span key={d.id} className="bg-surface-container-high text-body-sm px-3 py-1.5 rounded-full">
                        {tName[d.teacher_id] ?? '—'} ({d.role}) – {cName[d.class_id] ?? '—'}
                        <button className="ml-1 text-on-surface-variant hover:text-error" onClick={() => run(() => removeExamDuty(d.id), 'Removed')}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ExamModal open={addModal} classes={classes} onClose={() => setAddModal(false)} onSubmit={v => { run(() => createExam(v), 'Exam created'); setAddModal(false) }} />
      {dutyModal && <DutyModal exam={dutyModal} teachers={teachers} classes={classes} duties={duties} onClose={() => setDutyModal(null)} onSubmit={v => { run(() => assignExamDuty(dutyModal.id, v.teacher_id, v.class_id, v.role), 'Duty assigned'); setDutyModal(null) }} />}
    </div>
  )
}

function ExamModal({ open, classes, onClose, onSubmit }: { open: boolean; classes: ClassRow[]; onClose: () => void; onSubmit: (v: any) => void }) {
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="New Exam">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ name, class_id: classId, start_date: start, end_date: end }) }} noValidate>
        <Field label="Exam Name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><input type="date" className={inputCls} value={start} onChange={e => setStart(e.target.value)} required /></Field>
          <Field label="End Date"><input type="date" className={inputCls} value={end} onChange={e => setEnd(e.target.value)} required /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Create</button></div>
      </form>
    </Modal>
  )
}

function DutyModal({ exam, teachers, classes, duties, onClose, onSubmit }: { exam: ExamRow; teachers: StaffRow[]; classes: ClassRow[]; duties: ExamDutyRow[]; onClose: () => void; onSubmit: (v: any) => void }) {
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [role, setRole] = useState('invigilator')
  return (
    <Modal open onClose={onClose} title={`Assign Duty — ${exam.name}`}>
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ teacher_id: teacherId, class_id: classId, role }) }} noValidate>
        <Field label="Teacher"><select className={inputCls} value={teacherId} onChange={e => setTeacherId(e.target.value)} required><option value="">Select…</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Role"><select className={inputCls} value={role} onChange={e => setRole(e.target.value)}><option value="invigilator">Invigilator</option><option value="coordinator">Coordinator</option></select></Field>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Assign</button></div>
      </form>
    </Modal>
  )
}
