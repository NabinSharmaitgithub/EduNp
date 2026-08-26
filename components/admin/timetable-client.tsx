'use client'

import { useMemo, useState, useTransition } from 'react'
import { createTimetableEntry, deleteTimetableEntry } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import { DAYS_OF_WEEK } from '@/lib/types'
import type { ClassRow, SubjectRow, StaffRow, TimetableRow } from '@/lib/types'

export function TimetableClient({ timetable, classes, subjects, teachers, readOnly, error }: {
  timetable: TimetableRow[]; classes: ClassRow[]; subjects: SubjectRow[]; teachers: StaffRow[]; readOnly?: boolean; error?: string
}) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [classFilter, setClassFilter] = useState('all')
  const [addModal, setAddModal] = useState(false)
  const nameMap = useMemo(() => ({
    class: Object.fromEntries(classes.map(c => [c.id, c.name])),
    subject: Object.fromEntries(subjects.map(s => [s.id, s.name])),
    teacher: Object.fromEntries(teachers.map(t => [t.id, t.name])),
  }), [classes, subjects, teachers])

  const filtered = useMemo(() => classFilter === 'all' ? timetable : timetable.filter(t => t.class_id === classFilter), [timetable, classFilter])
  const grouped = useMemo(() => {
    const map = new Map<string, TimetableRow[]>()
    for (const d of DAYS_OF_WEEK) map.set(d, [])
    for (const t of filtered) map.get(t.day_of_week)?.push(t)
    for (const [, v] of map) v.sort((a, b) => a.period_number - b.period_number)
    return map
  }, [filtered])

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Timetable</h1>
        {!readOnly && <button className={btnPrimary} onClick={() => setAddModal(true)}><Icon name="add" /> Add Entry</button>}
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}
      <select aria-label="Filter by class" className={`${inputCls} mb-6 sm:w-52`} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
        <option value="all">All Classes</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📅" title="No timetable entries" hint="Add entries to schedule classes." />
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([day, entries]) => (
            <div key={day}>
              <h3 className="text-title-lg font-semibold capitalize mb-3">{day}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {entries.map(e => (
                  <div key={e.id} className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-4 flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Period {e.period_number}</p>
                      <p className="text-body-sm text-on-surface-variant">{nameMap.subject[e.subject_id] ?? '—'}</p>
                      <p className="text-body-sm text-on-surface-variant">{nameMap.teacher[e.teacher_id] ?? '—'}</p>
                      <p className="text-body-sm text-on-surface-variant">{e.start_time} – {e.end_time}</p>
                    </div>
                    {!readOnly && (
                      <button aria-label="Delete timetable entry" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deleteTimetableEntry(e.id), 'Deleted')}>
                        <Icon name="delete" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TimetableModal open={addModal} classes={classes} subjects={subjects} teachers={teachers} onClose={() => setAddModal(false)} onSubmit={(v) => { run(() => createTimetableEntry(v), 'Entry added'); setAddModal(false) }} />
    </div>
  )
}

function TimetableModal({ open, classes, subjects, teachers, onClose, onSubmit }: { open: boolean; classes: ClassRow[]; subjects: SubjectRow[]; teachers: StaffRow[]; onClose: () => void; onSubmit: (v: any) => void }) {
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [day, setDay] = useState<string>(DAYS_OF_WEEK[0])
  const [period, setPeriod] = useState(1)
  const [start, setStart] = useState('08:00')
  const [end, setEnd] = useState('08:45')
  return (
    <Modal open={open} onClose={onClose} title="Add Timetable Entry">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ class_id: classId, subject_id: subjectId, teacher_id: teacherId, day_of_week: day, period_number: period, start_time: start, end_time: end }) }} noValidate>
        <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Subject"><select className={inputCls} value={subjectId} onChange={e => setSubjectId(e.target.value)} required><option value="">Select…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Teacher"><select className={inputCls} value={teacherId} onChange={e => setTeacherId(e.target.value)} required><option value="">Select…</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Day"><select className={inputCls} value={day} onChange={e => setDay(e.target.value)}>{DAYS_OF_WEEK.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}</select></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Period"><input type="number" min={1} className={inputCls} value={period} onChange={e => setPeriod(+e.target.value)} /></Field>
          <Field label="Start"><input type="time" className={inputCls} value={start} onChange={e => setStart(e.target.value)} /></Field>
          <Field label="End"><input type="time" className={inputCls} value={end} onChange={e => setEnd(e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Add</button></div>
      </form>
    </Modal>
  )
}
