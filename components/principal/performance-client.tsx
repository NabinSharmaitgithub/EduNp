'use client'

import { useMemo, useState } from 'react'
import { gradeOf, barColor } from '@/lib/types'
import { Icon } from '@/components/icon'
import { EmptyState, Spinner } from '@/components/ui'
import type { ClassRow, StudentRow, SubjectRow, MarkRow } from '@/lib/types'

type Props = { classes: ClassRow[]; students: StudentRow[]; subjects: SubjectRow[]; marks: MarkRow[]; error?: string }

export function PrincipalPerformanceClient({ classes, students, subjects, marks, error }: Props) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? '')
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'pct'>('rank')

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects])

  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter(s => s.class_id === selectedClass)
  }, [students, selectedClass])

  const stats = useMemo(() => {
    return classStudents.map(student => {
      const studentMarks = marks.filter(m => m.student_id === student.id)
      const bySubject: Record<string, { obtained: number; max: number }> = {}
      let total = 0
      let totalMax = 0
      for (const m of studentMarks) {
        const subName = subjectMap[m.subject_id] ?? m.subject_id
        if (!bySubject[subName]) bySubject[subName] = { obtained: 0, max: 0 }
        bySubject[subName].obtained += m.marks_obtained
        bySubject[subName].max += m.max_marks
        total += m.marks_obtained
        totalMax += m.max_marks
      }
      const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : null
      return { student, bySubject, total, totalMax, pct }
    })
  }, [classStudents, marks, subjectMap])

  const ranked = useMemo(() => {
    const sorted = [...stats].sort((a, b) => {
      if (sortBy === 'name') return a.student.name.localeCompare(b.student.name)
      if (sortBy === 'pct') return (b.pct ?? 0) - (a.pct ?? 0)
      return (b.pct ?? 0) - (a.pct ?? 0)
    })
    return sorted.map((s, i) => ({ ...s, rank: i + 1 }))
  }, [stats, sortBy])

  const classAvg = useMemo(() => {
    const pctValues = stats.filter(s => s.pct !== null).map(s => s.pct as number)
    return pctValues.length ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : 0
  }, [stats])

  const classNames = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])

  function handlePrint() { window.print() }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-headline-lg">Class Performance Report</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Rankings and subject-wise performance</p>
        </div>
        {ranked.length > 0 && (
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors text-body-sm font-medium">
            <Icon name="print" /> Print / Export
          </button>
        )}
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <select aria-label="Select class" className="px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary sm:w-56" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' — ' + c.section : ''}</option>)}
        </select>
        <select aria-label="Sort by" className="px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary sm:w-44" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="rank">Sort by Rank</option>
          <option value="name">Sort by Name</option>
          <option value="pct">Sort by Performance</option>
        </select>
        {selectedClass && (
          <div className="bg-surface-container-lowest rounded-xl px-4 py-2 border border-outline-variant/50 flex items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">Class Average:</span>
            <span className={`text-title-sm font-bold ${classAvg >= 70 ? 'text-emerald-600' : classAvg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{classAvg}%</span>
          </div>
        )}
      </div>

      {ranked.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="bar_chart" title="No performance data" hint={selectedClass ? "No students or marks found for this class." : "Select a class to view performance."} />
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 font-medium w-16">Rank</th>
                <th className="py-3 px-4 font-medium">Student</th>
                <th className="py-3 px-4 font-medium">Roll #</th>
                {subjects.map(s => <th key={s.id} className="py-3 px-4 font-medium text-center">{s.name}</th>)}
                <th className="py-3 px-4 font-medium text-center">Overall</th>
                <th className="py-3 px-4 font-medium text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {ranked.map(s => {
                const g = gradeOf(s.pct)
                return (
                  <tr key={s.student.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-label-md font-bold ${s.rank === 1 ? 'bg-amber-100 text-amber-700' : s.rank === 2 ? 'bg-gray-100 text-gray-600' : s.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {s.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{s.student.name}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{s.student.roll_number}</td>
                    {subjects.map(sub => {
                      const subData = s.bySubject[sub.name]
                      const pct = subData && subData.max > 0 ? Math.round((subData.obtained / subData.max) * 100) : null
                      return (
                        <td key={sub.id} className="py-3 px-4 text-center">
                          {pct !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-body-sm font-medium">{pct}%</span>
                              <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          ) : <span className="text-on-surface-variant">—</span>}
                        </td>
                      )
                    })}
                    <td className="py-3 px-4 text-center">
                      {s.pct !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-body-sm font-bold">{s.pct}%</span>
                          <div className="w-20 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor(s.pct)}`} style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-on-surface-variant">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-label-md px-2.5 py-1 rounded-full font-medium ${g.cls}`}>{g.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
