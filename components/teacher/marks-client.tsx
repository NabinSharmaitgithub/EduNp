'use client'

import { useMemo, useState, useTransition } from 'react'
import { enterMark } from '@/app/teacher/actions'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Progress, btnPrimary, inputCls } from '@/components/ui'
import { EXAM_TERMS } from '@/lib/types'
import type { ClassRow, StudentRow, MarkRow, SubjectRow } from '@/lib/types'

export function TeacherMarksClient({ classes, students, marks, subjects }: {
  classes: ClassRow[]; students: StudentRow[]; marks: MarkRow[]; subjects: SubjectRow[]
}) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [term, setTerm] = useState<string>(EXAM_TERMS[0])
  const [edits, setEdits] = useState<Record<string, { marks?: string; max?: string }>>({})

  const classStudents = useMemo(() => students.filter(s => s.class_id === classId).sort((a, b) => {
    const ra = parseInt(a.roll_number) || 0; const rb = parseInt(b.roll_number) || 0
    return ra - rb
  }), [students, classId])

  const existing = useMemo(() => {
    const classStudentIds = new Set(classStudents.map(s => s.id))
    const map = new Map<string, MarkRow>()
    for (const m of marks) { if (classStudentIds.has(m.student_id) && m.subject_id === subjectId && m.exam_term === term) map.set(m.student_id, m) }
    return map
  }, [marks, classStudents, subjectId, term])

  const changedCount = Object.keys(edits).length

  function updateEdit(sid: string, field: 'marks' | 'max', val: string) {
    setEdits(p => ({ ...p, [sid]: { ...p[sid], [field]: val } }))
  }

  function saveAll() {
    startTransition(async () => {
      let ok = 0, fail = 0
      for (const s of classStudents) {
        const edit = edits[s.id]
        if (!edit) continue
        const marksObtained = Number(edit.marks)
        const maxMarks = Number(edit.max || 100)
        if (isNaN(marksObtained) || marksObtained < 0) { fail++; continue }
        if (marksObtained > maxMarks) { toast('error', `${s.name}: marks cannot exceed max marks`); fail++; continue }
        const res = await enterMark(s.id, subjectId, term, marksObtained, maxMarks)
        if (res.error) fail++
        else ok++
      }
      if (fail > 0) toast('error', `${ok} saved, ${fail} failed`)
      else { toast('success', `Marks saved for ${ok} students`); setEdits({}) }
    })
  }

  if (classes.length === 0 || subjects.length === 0) return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Marks Entry</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
        <EmptyState icon="📝" title="No subjects or classes assigned" hint="Contact the principal." />
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Marks Entry</h1>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="text-label-md text-on-surface-variant block mb-1.5">Class</label>
            <select aria-label="Filter by class" className={inputCls} value={classId} onChange={e => { setClassId(e.target.value); setEdits({}) }}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-label-md text-on-surface-variant block mb-1.5">Subject</label>
            <select aria-label="Filter by subject" className={inputCls} value={subjectId} onChange={e => { setSubjectId(e.target.value); setEdits({}) }}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-label-md text-on-surface-variant block mb-1.5">Exam Term</label>
            <select aria-label="Filter by exam term" className={inputCls} value={term} onChange={e => { setTerm(e.target.value); setEdits({}) }}>
              {EXAM_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {classStudents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📋" title="No students in this class" />
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider text-label-md">
                  <th className="py-3 px-6 font-medium">Student</th>
                  <th className="py-3 px-6 font-medium">Previous</th>
                  <th className="py-3 px-6 font-medium">Marks Obtained</th>
                  <th className="py-3 px-6 font-medium">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {classStudents.map(s => {
                  const prev = existing.get(s.id)
                  const edit = edits[s.id]
                  return (
                    <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                      <td className="py-3 px-6 font-medium">{s.name}</td>
                      <td className="py-3 px-6 text-on-surface-variant">
                        {prev ? <Progress pct={(prev.marks_obtained / prev.max_marks) * 100} /> : <span className="text-on-surface-variant/50">—</span>}
                      </td>
                      <td className="py-3 px-6">
                        <input type="number" step="0.5" min={0} className="w-24 px-2 py-1.5 border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-body-sm"
                          value={edit?.marks ?? prev?.marks_obtained ?? ''}
                          onChange={e => updateEdit(s.id, 'marks', e.target.value)}
                          placeholder="0" />
                      </td>
                      <td className="py-3 px-6">
                        <input type="number" min={1} className="w-20 px-2 py-1.5 border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-body-sm"
                          value={edit?.max ?? prev?.max_marks ?? 100}
                          onChange={e => updateEdit(s.id, 'max', e.target.value)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-body-sm text-on-surface-variant">{classStudents.length} students · {changedCount > 0 ? `${changedCount} unsaved` : 'all saved'}</p>
            <button className={btnPrimary} onClick={saveAll} disabled={pending || changedCount === 0}>
              {pending ? 'Saving…' : 'Save Marks'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
