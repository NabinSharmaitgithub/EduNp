'use client'

import { useMemo, useState, useTransition } from 'react'
import { bulkMarkAttendance } from '@/app/teacher/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, btnPrimary, inputCls } from '@/components/ui'
import { ATTENDANCE_STATUSES } from '@/lib/types'
import type { ClassRow, StudentRow, AttendanceRow } from '@/lib/types'

export function TeacherAttendanceClient({ classes, students, attendance }: {
  classes: ClassRow[]; students: StudentRow[]; attendance: AttendanceRow[]
}) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState<Record<string, string>>({})

  const classStudents = useMemo(() => students.filter(s => s.class_id === classId), [students, classId])

  const existing = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of attendance) { if (a.class_id === classId && a.date === date) map.set(a.student_id, a.status) }
    return map
  }, [attendance, classId, date])

  const displayRecords = useMemo(() => {
    const out: Record<string, string> = Object.fromEntries(existing)
    for (const [k, v] of Object.entries(records)) out[k] = v
    return out
  }, [existing, records])

  function setRec(sid: string, status: string) { setRecords(p => ({ ...p, [sid]: status })) }

  function save() {
    startTransition(async () => {
      const allRecords = classStudents.map(s => ({ student_id: s.id, status: records[s.id] ?? existing.get(s.id) ?? 'present' }))
      const res = await bulkMarkAttendance(classId, date, allRecords)
      if (res.error) toast('error', res.error)
      else { toast('success', 'Attendance saved'); setRecords({}) }
    })
  }

  if (classes.length === 0) return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Attendance</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom"><EmptyState icon="📋" title="No classes assigned" hint="Contact the principal." /></div>
    </div>
  )

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Attendance</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <select aria-label="Filter by class" className={`${inputCls} sm:w-52`} value={classId} onChange={e => { setClassId(e.target.value); setRecords({}) }}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className={inputCls} value={date} onChange={e => { setDate(e.target.value); setRecords({}) }} />
      </div>

      {classStudents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom"><EmptyState icon="📋" title="No students in this class" /></div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead><tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Student</th><th className="py-3 px-6 font-medium">Roll No</th><th className="py-3 px-6 font-medium">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-outline-variant">
                {classStudents.map(s => (
                  <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6 font-medium">{s.name}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{s.roll_number}</td>
                    <td className="py-3 px-6">
                      <div className="flex gap-2">
                        {ATTENDANCE_STATUSES.map(st => (
                          <button key={st} onClick={() => setRec(s.id, st)} className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors capitalize ${(displayRecords[s.id] ?? 'present') === st ? st === 'present' ? 'bg-emerald-500 text-white' : st === 'absent' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button className={btnPrimary} onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save Attendance'}</button>
          </div>
        </>
      )}
    </div>
  )
}
