import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/role'
import Shell from '@/components/shell'

export const metadata = { title: 'EduSchool' }

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile()
  if (!profile) redirect('/login?error=no_access')

  return (
    <Shell user={{ email: user.email || '', name: profile.name }} profile={profile}>
      {children}
    </Shell>
  )
}
