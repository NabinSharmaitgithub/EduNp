'use client'

import Link from 'next/link'
import { Avatar, GradePill, Progress } from '@/components/ui'
import type { StudentRow, MarkRow, SubjectRow } from '@/lib/types'

interface Props {
  className: string; classId: string; students: StudentRow[]; marks: MarkRow[]; subjects: SubjectRow[]
}

export function TeacherClassDetailClient({ className, classId, students, marks, subjects }: Props) {
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]))

  const avgByStudent = new Map<string, { obtained: number; max: number }>()
  for (const m of marks) {
    const cur = avgByStudent.get(m.student_id) ?? { obtained: 0, max: 0 }
    cur.obtained += m.marks_obtained
    cur.max += m.max_marks
    avgByStudent.set(m.student_id, cur)
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/teacher/classes" className="text-primary hover:underline text-body-sm">← My Classes</Link>
        <span className="text-on-surface-variant text-body-sm">/</span>
        <h1 className="text-headline-lg">{className}</h1>
      </div>

      {students.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">👤</div>
            <p className="text-title-lg">No students in this class</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider text-label-md">
                <th className="py-3 px-6 font-medium">Student</th>
                <th className="py-3 px-6 font-medium">Roll No</th>
                <th className="py-3 px-6 font-medium">Avg Score</th>
                <th className="py-3 px-6 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.map(s => {
                const avg = avgByStudent.get(s.id)
                const pct = avg && avg.max > 0 ? Math.round((avg.obtained / avg.max) * 100) : null
                return (
                  <tr key={s.id} className="hover:bg-primary-container/5 transition-colors">
                    <td className="py-3 px-6"><div className="flex items-center gap-2"><Avatar name={s.name} size="sm" /><span className="font-medium">{s.name}</span></div></td>
                    <td className="py-3 px-6 text-on-surface-variant">{s.roll_number}</td>
                    <td className="py-3 px-6 w-40"><Progress pct={pct} /></td>
                    <td className="py-3 px-6"><GradePill pct={pct} /></td>
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
