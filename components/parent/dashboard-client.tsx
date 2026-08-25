'use client'

import { useMemo } from 'react'
import { computeStudentStats } from '@/lib/stats'
import { Avatar, GradePill, Progress } from '@/components/ui'
import type { StudentRow, ClassRow, MarkRow, SubjectRow, AttendanceRow, FeeRow } from '@/lib/types'

export function ParentDashboardClient({ student, cls, marks, subjects, attendance, fees, parentName }: {
  student: StudentRow; cls: ClassRow | null; marks: MarkRow[]; subjects: SubjectRow[]; attendance: AttendanceRow[]; fees: FeeRow[]; parentName: string
}) {
  const subjectName = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects])
  const stats = useMemo(() => computeStudentStats([student], marks), [student, marks])
  const studentStats = stats[0]

  const attendanceSummary = useMemo(() => {
    let present = 0, absent = 0, late = 0
    for (const a of attendance) {
      if (a.status === 'present') present++
      else if (a.status === 'absent') absent++
      else late++
    }
    const total = present + absent + late
    return { present, absent, late, total, pct: total > 0 ? Math.round((present / total) * 100) : null }
  }, [attendance])

  const feeSummary = useMemo(() => {
    const totalDue = fees.reduce((a, f) => a + f.amount_due, 0)
    const totalPaid = fees.reduce((a, f) => a + f.amount_paid, 0)
    const overdue = fees.filter(f => f.status === 'overdue').length
    return { totalDue, totalPaid, overdue }
  }, [fees])

  const bySubject = useMemo(() => {
    if (!studentStats) return []
    return Object.entries(studentStats.bySubject).map(([sid, v]) => ({
      name: subjectName[sid] ?? '—',
      obtained: v.obtained,
      max: v.max,
      pct: v.max > 0 ? (v.obtained / v.max) * 100 : null,
    }))
  }, [studentStats, subjectName])

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-2">Welcome, {parentName}</h1>
      <p className="text-body-sm text-on-surface-variant mb-6">Here&apos;s an overview of your child&apos;s academic progress.</p>

      {/* Student profile card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-6 flex items-center gap-4">
        <Avatar name={student.name} size="lg" />
        <div>
          <h2 className="text-headline-sm font-bold">{student.name}</h2>
          <p className="text-body-sm text-on-surface-variant">Roll No {student.roll_number} · {cls?.name ?? '—'} {cls?.section ? `Section ${cls.section}` : ''}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50">
          <span className="text-body-sm text-on-surface-variant">Overall Average</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-headline-md">{studentStats?.pct !== null ? `${Math.round(studentStats!.pct!)}%` : '—'}</p>
            {studentStats?.pct !== null && <GradePill pct={studentStats.pct} />}
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50">
          <span className="text-body-sm text-on-surface-variant">Attendance Rate</span>
          <p className="text-headline-md mt-1">{attendanceSummary.pct !== null ? `${attendanceSummary.pct}%` : '—'}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50">
          <span className="text-body-sm text-on-surface-variant">Total Paid</span>
          <p className="text-headline-md mt-1 text-emerald-600">NPR {feeSummary.totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50">
          <span className="text-body-sm text-on-surface-variant">Pending Dues</span>
          <p className={`text-headline-md mt-1 ${feeSummary.overdue > 0 ? 'text-red-600' : 'text-on-surface'}`}>NPR {(feeSummary.totalDue - feeSummary.totalPaid).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marks by subject */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
          <h3 className="text-title-lg font-semibold mb-4">Marks by Subject</h3>
          {bySubject.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm">No marks recorded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-label-md text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="py-2 font-medium">Subject</th>
                  <th className="py-2 font-medium">Score</th>
                  <th className="py-2 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {bySubject.map(r => (
                  <tr key={r.name}>
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2"><Progress pct={r.pct} /></td>
                    <td className="py-2"><GradePill pct={r.pct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent attendance */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
          <h3 className="text-title-lg font-semibold mb-4">Recent Attendance</h3>
          <div className="flex gap-4 mb-4">
            <span className="bg-emerald-100 text-emerald-700 text-label-md px-3 py-1 rounded-full">Present: {attendanceSummary.present}</span>
            <span className="bg-red-100 text-red-700 text-label-md px-3 py-1 rounded-full">Absent: {attendanceSummary.absent}</span>
            <span className="bg-amber-100 text-amber-700 text-label-md px-3 py-1 rounded-full">Late: {attendanceSummary.late}</span>
          </div>
          {attendance.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm">No attendance records.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {attendance.slice(0, 15).map(a => (
                <div key={a.id} className="flex justify-between items-center py-1.5 border-b border-outline-variant/20 last:border-0">
                  <span className="text-body-sm text-on-surface-variant">{new Date(a.date).toLocaleDateString()}</span>
                  <span className={`text-label-md px-2 py-0.5 rounded-full capitalize ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fees */}
      {fees.length > 0 && (
        <div className="mt-6 bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
          <h3 className="text-title-lg font-semibold mb-4">Fee Records</h3>
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="text-label-md text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
                <th className="py-2 font-medium">Amount Due</th>
                <th className="py-2 font-medium">Paid</th>
                <th className="py-2 font-medium">Due Date</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {fees.map(f => (
                <tr key={f.id}>
                  <td className="py-2">NPR {f.amount_due.toLocaleString()}</td>
                  <td className="py-2">NPR {f.amount_paid.toLocaleString()}</td>
                  <td className="py-2 text-on-surface-variant">{new Date(f.due_date).toLocaleDateString()}</td>
                  <td className="py-2"><span className={`${f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : f.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} text-label-md px-2 py-1 rounded-full capitalize`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
