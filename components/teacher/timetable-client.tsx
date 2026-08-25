'use client'

import { useMemo } from 'react'
import { EmptyState } from '@/components/ui'
import { DAYS_OF_WEEK } from '@/lib/types'
import type { ClassRow, SubjectRow, TimetableRow } from '@/lib/types'

export function TeacherTimetableClient({ timetable, classes, subjects }: {
  timetable: TimetableRow[]; classes: ClassRow[]; subjects: SubjectRow[]
}) {
  const cName = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes])
  const sName = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects])
  const grouped = useMemo(() => {
    const map = new Map<string, TimetableRow[]>()
    for (const d of DAYS_OF_WEEK) map.set(d, [])
    for (const t of timetable) map.get(t.day_of_week)?.push(t)
    for (const [, v] of map) v.sort((a, b) => a.period_number - b.period_number)
    return map
  }, [timetable])

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">My Timetable</h1>
      {timetable.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom"><EmptyState icon="📅" title="No timetable entries" hint="Contact the principal." /></div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([day, entries]) => (
            <div key={day}>
              <h3 className="text-title-lg font-semibold capitalize mb-3">{day}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {entries.map(e => (
                  <div key={e.id} className="bg-surface-container-lowest rounded-lg border border-outline-variant/50 p-4">
                    <p className="font-semibold">Period {e.period_number}</p>
                    <p className="text-body-sm text-on-surface-variant">{sName[e.subject_id] ?? '—'}</p>
                    <p className="text-body-sm text-on-surface-variant">{cName[e.class_id] ?? '—'}</p>
                    <p className="text-body-sm text-on-surface-variant">{e.start_time} – {e.end_time}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
