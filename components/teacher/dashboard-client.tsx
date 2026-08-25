'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { computeStudentStats } from '@/lib/stats'
import { Avatar, GradePill, Progress } from '@/components/ui'
import type { ClassRow, StudentRow, MarkRow, SubjectRow } from '@/lib/types'

export function TeacherDashboardClient({ classes, students, marks, subjects }: {
  classes: ClassRow[]; students: StudentRow[]; marks: MarkRow[]; subjects: SubjectRow[]
}) {
  const stats = useMemo(() => computeStudentStats(students, marks), [students, marks])
  const statsMap = useMemo(() => new Map(stats.map(s => [s.student.id, s])), [stats])
  const byClass = useMemo(() => {
    const map = new Map<string, StudentRow[]>()
    for (const s of students) { const arr = map.get(s.class_id) ?? []; arr.push(s); map.set(s.class_id, arr) }
    return map
  }, [students])

  const totalAvg = useMemo(() => {
    const withMarks = stats.filter(s => s.pct !== null)
    if (!withMarks.length) return null
    return Math.round((withMarks.reduce((a, s) => a + s.total, 0) / withMarks.reduce((a, s) => a + s.totalMax, 0)) * 100)
  }, [stats])

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">My Classes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">My Classes</span><p className="text-headline-md">{classes.length}</p></div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">My Students</span><p className="text-headline-md">{students.length}</p></div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50"><span className="text-body-sm text-on-surface-variant">Avg. Score</span><p className="text-headline-md text-primary">{totalAvg !== null ? `${totalAvg}%` : '—'}</p></div>
      </div>

      {classes.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-8 text-center">
          <p className="text-on-surface-variant">No classes assigned yet. Contact the principal.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map(c => {
            const clsStudents = byClass.get(c.id) ?? []
            return (
              <div key={c.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
                  <h2 className="text-title-lg font-semibold">{c.name}</h2>
                  <Link href={`/classes/${c.id}`} className="text-primary text-body-sm hover:underline">View All →</Link>
                </div>
                {clsStudents.length === 0 ? (
                  <p className="p-4 text-on-surface-variant text-body-sm">No students yet.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider text-label-md">
                        <th className="py-2 px-4 font-medium">Student</th>
                        <th className="py-2 px-4 font-medium">Roll No</th>
                        <th className="py-2 px-4 font-medium">Avg</th>
                        <th className="py-2 px-4 font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {clsStudents.slice(0, 5).map(s => {
                        const st = statsMap.get(s.id)
                        return (
                          <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                            <td className="py-2 px-4"><div className="flex items-center gap-2"><Avatar name={s.name} size="sm" /><span className="font-medium">{s.name}</span></div></td>
                            <td className="py-2 px-4 text-on-surface-variant">{s.roll_number}</td>
                            <td className="py-2 px-4 w-40"><Progress pct={st?.pct ?? null} /></td>
                            <td className="py-2 px-4"><GradePill pct={st?.pct ?? null} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
