'use client'

import type { AnnouncementRow } from '@/lib/types'

export function HelpingStaffAnnouncementsClient({ announcements }: { announcements: AnnouncementRow[] }) {
  if (announcements.length === 0) return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Announcements</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">📢</div>
          <p className="text-title-lg">No announcements</p>
          <p className="text-body-md text-on-surface-variant max-w-xs">There are no school-wide announcements at this time.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Announcements</h1>
      <div className="space-y-4">
        {announcements.map(a => (
          <article key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-title-lg font-semibold mb-2">{a.title}</h2>
                <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{a.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant/30">
              <span className="text-body-sm text-on-surface-variant/60">{new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="text-label-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.target}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
