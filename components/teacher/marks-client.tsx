'use client'

import { useMemo, useState, useTransition } from 'react'
import { enterMark } from '@/app/teacher/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Progress, btnPrimary, inputCls, Spinner } from '@/components/ui'
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

  const classStudents = useMemo(() => students.filter(s => s.class_id === classId), [students, classId])

  const existing = useMemo(() => {
    const map = new Map<string, MarkRow>()
    for (const m of marks) { if (m.subject_id === subjectId && m.exam_term === term) map.set(m.student_id, m) }
    return map
  }, [marks, subjectId, term])

  function saveAll(formData: FormData) {
    startTransition(async () => {
      let ok = 0, fail = 0
      for (const s of classStudents) {
        const val = formData.get(`mark_${s.id}`)
        if (!val || val === '') continue
        const marksObtained = Number(val)
        const maxMarks = Number(formData.get(`max_${s.id}`) || 100)
        const res = await enterMark(s.id, subjectId, term, marksObtained, maxMarks)
        if (res.error) fail++
        else ok++
      }
      toast(fail > 0 ? 'error' : 'success', fail > 0 ? `${ok} saved, ${fail} failed` : `Marks for ${classStudents.length} students saved`)
    })
  }

  if (classes.length === 0 || subjects.length === 0) return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Marks</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom"><EmptyState icon="📝" title="No subjects or classes assigned" hint="Contact the principal to get subject/class assignments." /></div>
    </div>
  )

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Enter Marks</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <select className={`${inputCls} sm:w-44`} value={classId} onChange={e => setClassId(e.target.value)}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={`${inputCls} sm:w-44`} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${inputCls} sm:w-44`} value={term} onChange={e => setTerm(e.target.value)}>
          {EXAM_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {classStudents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom"><EmptyState icon="📋" title="No students in this class" /></div>
      ) : (
        <form action={saveAll}>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead><tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Student</th>
                <th className="py-3 px-6 font-medium">Previous</th>
                <th className="py-3 px-6 font-medium">Marks</th>
                <th className="py-3 px-6 font-medium">Max</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant">
                {classStudents.map(s => {
                  const prev = existing.get(s.id)
                  return (
                    <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                      <td className="py-3 px-6 font-medium">{s.name}</td>
                      <td className="py-3 px-6 text-on-surface-variant">
                        {prev ? <Progress pct={(prev.marks_obtained / prev.max_marks) * 100} /> : '—'}
                      </td>
                      <td className="py-3 px-6">
                        <input type="number" name={`mark_${s.id}`} step="0.5" min={0} max={100} className="w-24 px-2 py-1 border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary" defaultValue={prev?.marks_obtained ?? ''} placeholder="0" />
                      </td>
                      <td className="py-3 px-6">
                        <input type="number" name={`max_${s.id}`} min={1} className="w-20 px-2 py-1 border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary" defaultValue={prev?.max_marks ?? 100} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className={btnPrimary} disabled={pending}>{pending ? 'Saving…' : 'Save All Marks'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
