'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { computeStudentStats } from '@/lib/stats'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, StaffRow, FeeRow, AttendanceRow } from '@/lib/types'

const COLORS = ['#002053', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function AdminAnalyticsClient({ classes, students, marks, subjects, staff, fees, attendance, error }: {
  classes: ClassRow[]; students: StudentRow[]; marks: MarkRow[]; subjects: SubjectRow[]
  staff: StaffRow[]; fees: FeeRow[]; attendance: AttendanceRow[]; error?: string
}) {
  const stats = useMemo(() => computeStudentStats(students, marks), [students, marks])

  const classPerf = useMemo(() => {
    const map = new Map<string, { total: number; max: number; count: number }>()
    for (const s of stats) {
      const cur = map.get(s.student.class_id) ?? { total: 0, max: 0, count: 0 }
      if (s.pct !== null) { cur.total += s.total; cur.max += s.totalMax }
      cur.count++
      map.set(s.student.class_id, cur)
    }
    return classes.map(c => {
      const e = map.get(c.id)
      return { name: c.name, avg: e && e.max > 0 ? Math.round((e.total / e.max) * 100) : 0, students: e?.count ?? 0 }
    })
  }, [classes, stats])

  const gradeDistrib = useMemo(() => {
    const buckets: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 }
    for (const s of stats) {
      if (s.pct === null) continue
      const g = s.pct >= 90 ? 'A+' : s.pct >= 80 ? 'A' : s.pct >= 70 ? 'B+' : s.pct >= 60 ? 'B' : s.pct >= 50 ? 'C+' : s.pct >= 40 ? 'C' : s.pct >= 30 ? 'D' : 'F'
      buckets[g]++
    }
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [stats])

  const feeStatus = useMemo(() => {
    const paid = fees.filter(f => f.status === 'paid').length
    const due = fees.filter(f => f.status === 'due').length
    const overdue = fees.filter(f => f.status === 'overdue').length
    return [
      { name: 'Paid', value: paid },
      { name: 'Due', value: due },
      { name: 'Overdue', value: overdue },
    ].filter(d => d.value > 0)
  }, [fees])

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; late: number }>()
    for (const a of attendance) {
      const cur = map.get(a.date) ?? { present: 0, absent: 0, late: 0 }
      if (a.status === 'present') cur.present++
      else if (a.status === 'absent') cur.absent++
      else cur.late++
      map.set(a.date, cur)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, v]) => ({
      date: date.slice(5), present: v.present, absent: v.absent, late: v.late,
    }))
  }, [attendance])

  const totalStudents = students.length
  const totalTeachers = staff.filter(s => s.role === 'teacher').length
  const overallAvg = useMemo(() => {
    const withMarks = stats.filter(s => s.pct !== null)
    if (!withMarks.length) return null
    return Math.round((withMarks.reduce((a, s) => a + s.total, 0) / withMarks.reduce((a, s) => a + s.totalMax, 0)) * 100)
  }, [stats])

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Analytics</h1>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Students" value={totalStudents} icon="school" />
        <KpiCard label="Teachers" value={totalTeachers} icon="people" />
        <KpiCard label="Classes" value={classes.length} icon="class" />
        <KpiCard label="Avg. Score" value={overallAvg !== null ? `${overallAvg}%` : '—'} icon="trending_up" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Class Performance">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#002053" radius={[4, 4, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Grade Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={gradeDistrib} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                {gradeDistrib.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Fee Collection">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={feeStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                {feeStatus.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i] ?? COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Trend (14 days)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
        <span className="text-body-sm text-on-surface-variant font-medium">{label}</span>
      </div>
      <div className={`text-headline-md ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
      <h3 className="text-title-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}
