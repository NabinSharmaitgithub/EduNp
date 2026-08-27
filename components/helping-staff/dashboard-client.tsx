'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Icon } from '@/components/icon'
import { DAYS_OF_WEEK } from '@/lib/types'
import type { AnnouncementRow, TimetableRow, ClassRow, SubjectRow } from '@/lib/types'

interface Props {
  timetable: TimetableRow[]; announcements: AnnouncementRow[]; classes: ClassRow[]; subjects: SubjectRow[]
}

export function HelpingStaffDashboardClient({ timetable, announcements, classes, subjects }: Props) {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects])
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes])

  const today = useMemo(() => {
    const d = new Date().getDay()
    return DAYS_OF_WEEK[d === 0 ? 6 : d - 1]
  }, [])

  const todayPeriods = useMemo(() =>
    timetable.filter(t => t.day_of_week === today).sort((a, b) => a.period_number - b.period_number),
    [timetable, today]
  )

  const todayAnnouncements = useMemo(() =>
    announcements.filter(a => {
      const created = new Date(a.created_at)
      const now = new Date()
      return created.toDateString() === now.toDateString()
    }),
    [announcements]
  )

  const recentAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements])

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl">
            <Icon name="badge" className="text-xl" />
          </div>
          <div>
            <h1 className="text-headline-lg">Welcome back</h1>
            <p className="text-body-md text-on-surface-variant">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/helping-staff/timetable" className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Icon name="schedule" className="text-xl" /></div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Today&apos;s Periods</p>
              <p className="text-headline-md font-bold">{todayPeriods.length}</p>
            </div>
          </div>
        </Link>
        <Link href="/helping-staff/announcements" className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Icon name="campaign" className="text-xl" /></div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Announcements</p>
              <p className="text-headline-md font-bold">{announcements.length}</p>
            </div>
          </div>
        </Link>
        <Link href="/helping-staff/leave" className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Icon name="event_busy" className="text-xl" /></div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Leave</p>
              <p className="text-body-md font-medium text-primary mt-0.5">Request →</p>
            </div>
          </div>
        </Link>
      </div>

      {recentAnnouncements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-lg font-semibold">Recent Announcements</h2>
            <Link href="/helping-staff/announcements" className="text-primary text-body-sm font-medium hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.map(a => (
              <div key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
                <h3 className="text-title-md font-semibold mb-1">{a.title}</h3>
                <p className="text-body-sm text-on-surface-variant line-clamp-2">{a.body}</p>
                <p className="text-body-sm text-on-surface-variant/60 mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentAnnouncements.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-8 text-center">
          <p className="text-on-surface-variant">No announcements yet.</p>
        </div>
      )}
    </div>
  )
}
