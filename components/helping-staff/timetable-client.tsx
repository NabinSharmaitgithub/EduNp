'use client'

import { useMemo } from 'react'
import { EmptyState } from '@/components/ui'
import { DAYS_OF_WEEK } from '@/lib/types'
import type { TimetableRow, ClassRow, SubjectRow } from '@/lib/types'

export function HelpingStaffTimetableClient({ timetable, classes, subjects }: {
  timetable: TimetableRow[]; classes: ClassRow[]; subjects: SubjectRow[]
}) {
  const cName = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])
  const sName = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects])

  const today = useMemo(() => {
    const d = new Date().getDay()
    return DAYS_OF_WEEK[d === 0 ? 6 : d - 1]
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, TimetableRow[]>()
    for (const d of DAYS_OF_WEEK) map.set(d, [])
    for (const t of timetable) map.get(t.day_of_week)?.push(t)
    for (const [, v] of map) v.sort((a, b) => a.period_number - b.period_number)
    return map
  }, [timetable])

  if (timetable.length === 0) return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">School Timetable</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
        <EmptyState icon="📅" title="No timetable entries" hint="The timetable hasn't been set up yet." />
      </div>
    </div>
  )

  const periodColors = ['bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-purple-50 border-purple-200', 'bg-rose-50 border-rose-200', 'bg-cyan-50 border-cyan-200']

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">School Timetable</h1>
      <p className="text-body-md text-on-surface-variant mb-6">Read-only view of the school timetable.</p>

      <div className="space-y-6">
        {[...grouped.entries()].map(([day, entries]) => {
          const isToday = day === today
          return (
            <div key={day}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-title-lg font-semibold capitalize">{day}</h3>
                {isToday && <span className="text-label-sm px-2 py-0.5 rounded-full bg-primary text-on-primary font-medium">Today</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {entries.map((e, i) => (
                  <div key={e.id} className={`rounded-xl border p-4 ${isToday ? 'bg-white shadow-md border-primary/20' : 'bg-surface-container-lowest border-outline-variant/50 shadow-bloom'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-md font-semibold text-on-surface">Period {e.period_number}</span>
                      <span className="text-body-sm text-on-surface-variant">{e.start_time} – {e.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${periodColors[(e.period_number - 1) % periodColors.length].split(' ')[0]}`} />
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{sName[e.subject_id] ?? '—'}</p>
                        <p className="text-body-sm text-on-surface-variant">{cName[e.class_id] ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
