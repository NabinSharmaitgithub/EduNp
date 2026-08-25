'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { sb as createClient } from '@/lib/supabase/client'
import { Icon } from './icon'
import type { UserProfile } from '@/lib/types'

const NAV: { label: string; href: string; icon: string; roles: UserProfile['role'][] }[] = [
  { label: 'Analytics', href: '/admin', icon: 'analytics', roles: ['principal', 'admin'] },
  { label: 'Classes', href: '/classes', icon: 'school', roles: ['principal', 'admin', 'teacher'] },
  { label: 'Staff', href: '/admin/staff', icon: 'people', roles: ['principal', 'admin'] },
  { label: 'Assignments', href: '/admin/assignments', icon: 'assignment_ind', roles: ['principal', 'admin'] },
  { label: 'Attendance', href: '/admin/attendance', icon: 'event_available', roles: ['principal', 'admin'] },
  { label: 'Timetable', href: '/admin/timetable', icon: 'schedule', roles: ['principal', 'admin'] },
  { label: 'Fees', href: '/admin/fees', icon: 'payments', roles: ['principal', 'admin'] },
  { label: 'Announcements', href: '/admin/announcements', icon: 'campaign', roles: ['principal', 'admin'] },
  { label: 'Exams', href: '/admin/exams', icon: 'quiz', roles: ['principal', 'admin'] },
  { label: 'Leave', href: '/admin/leave', icon: 'event_busy', roles: ['principal', 'admin'] },
  { label: 'Audit Log', href: '/admin/audit-log', icon: 'history', roles: ['principal', 'admin'] },
  { label: 'Import', href: '/admin/import', icon: 'upload_file', roles: ['principal', 'admin'] },
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['teacher'] },
  { label: 'Attendance', href: '/teacher/attendance', icon: 'event_available', roles: ['teacher'] },
  { label: 'Marks', href: '/teacher/marks', icon: 'grade', roles: ['teacher'] },
  { label: 'Timetable', href: '/teacher/timetable', icon: 'schedule', roles: ['teacher'] },
  { label: 'Leave', href: '/teacher/leave', icon: 'event_busy', roles: ['teacher'] },
  { label: 'Dashboard', href: '/parent', icon: 'dashboard', roles: ['parent'] },
]

export default function Shell({ user, profile, children }: { user: { email: string; name?: string }; profile: UserProfile; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const nav = NAV.filter(i => i.roles.includes(profile.role))

  const active = (href: string) => href === '/admin' || href === '/parent' ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const logout = async () => { await createClient().auth.signOut(); router.push('/login') }

  const Side = () => (
    <>
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold">EduSchool</h1>
        <p className="text-xs text-blue-300 mt-1 capitalize">{profile.role}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(i => (
          <Link key={i.href} href={i.href} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active(i.href) ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <Icon name={i.icon} className="text-xl" />{i.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{profile.name.charAt(0).toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.name}</p>
            <p className="text-xs text-blue-300 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 w-full text-left text-xs text-blue-300 hover:text-white flex items-center gap-2">
          <Icon name="logout" className="text-base" />Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#002053] text-white shrink-0"><Side /></aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#002053] text-white flex flex-col"><Side /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b flex items-center px-4 lg:px-6 shrink-0">
          <button className="lg:hidden mr-3 p-1" onClick={() => setMobileOpen(true)}><Icon name="menu" className="text-xl" /></button>
          <div className="flex-1" />
          <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
