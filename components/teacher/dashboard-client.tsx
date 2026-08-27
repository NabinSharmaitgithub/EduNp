'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Icon } from '@/components/icon'
import type { ClassRow, StudentRow, MarkRow, SubjectRow, TimetableRow } from '@/lib/types'
import { DAYS_OF_WEEK } from '@/lib/types'

interface Props {
  classes: ClassRow[]; students: StudentRow[]; marks: MarkRow[]; subjects: SubjectRow[]; timetable: TimetableRow[]; examsCount: number
}

export function TeacherDashboardClient({ classes, students, marks, subjects, timetable, examsCount }: Props) {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects])

  const studentCountByClass = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1)
    return map
  }, [students])

  const today = useMemo(() => {
    const d = new Date().getDay()
    return DAYS_OF_WEEK[d === 0 ? 6 : d - 1]
  }, [])

  const todayPeriods = useMemo(() => {
    return timetable.filter(t => t.day_of_week === today).sort((a, b) => a.period_number - b.period_number)
  }, [timetable, today])

  const totalAvg = useMemo(() => {
    const withMarks = marks.filter(m => m.max_marks > 0)
    if (!withMarks.length) return null
    return Math.round((withMarks.reduce((a, m) => a + m.marks_obtained, 0) / withMarks.reduce((a, m) => a + m.max_marks, 0)) * 100)
  }, [marks])

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Teacher Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KPICard icon="school" label="My Classes" value={classes.length} color="bg-blue-50 text-blue-600" />
        <KPICard icon="people" label="Total Students" value={students.length} color="bg-emerald-50 text-emerald-600" />
        <KPICard icon="schedule" label="Today's Periods" value={todayPeriods.length} color="bg-amber-50 text-amber-600" />
        <KPICard icon="grade" label="Avg Score" value={totalAvg !== null ? `${totalAvg}%` : '—'} color="bg-purple-50 text-purple-600" />
      </div>

      {classes.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">📚</div>
            <p className="text-title-lg">No classes assigned yet</p>
            <p className="text-body-md text-on-surface-variant max-w-xs">Contact the principal to get class assignments.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-lg font-semibold">My Classes</h2>
              <Link href="/teacher/classes" className="text-primary text-body-sm font-medium hover:underline flex items-center gap-1">View All <span className="text-xs">→</span></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(c => (
                <Link key={c.id} href={`/teacher/classes/${c.id}`} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-sm">{c.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-title-md font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                      {c.section && <p className="text-body-sm text-on-surface-variant">{c.section}</p>}
                    </div>
                  </div>
                  <p className="text-body-sm text-on-surface-variant"><span className="font-medium text-on-surface">{studentCountByClass.get(c.id) ?? 0}</span> students</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title-lg font-semibold">Today&apos;s Timetable</h2>
              <Link href="/teacher/timetable" className="text-primary text-body-sm font-medium hover:underline">Full Timetable →</Link>
            </div>
            {todayPeriods.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-8 text-center">
                <p className="text-on-surface-variant">No periods scheduled for today.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider text-label-md">
                      <th className="py-3 px-6 font-medium">Period</th>
                      <th className="py-3 px-6 font-medium">Subject</th>
                      <th className="py-3 px-6 font-medium">Class</th>
                      <th className="py-3 px-6 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {todayPeriods.map(p => (
                      <tr key={p.id} className="hover:bg-primary-container/5 transition-colors">
                        <td className="py-3 px-6 font-medium">{p.period_number}</td>
                        <td className="py-3 px-6 text-on-surface">{subjectMap.get(p.subject_id) ?? '—'}</td>
                        <td className="py-3 px-6 text-on-surface-variant">{classes.find(cl => cl.id === p.class_id)?.name ?? '—'}</td>
                        <td className="py-3 px-6 text-on-surface-variant">{p.start_time} – {p.end_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function KPICard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}><Icon name={icon} className="text-xl" /></div>
        <div>
          <p className="text-body-sm text-on-surface-variant">{label}</p>
          <p className="text-headline-md font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}
