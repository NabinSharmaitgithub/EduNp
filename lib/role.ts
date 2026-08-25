import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from './types'

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff').select('id, name, email, role')
    .eq('user_id', user.id).eq('status', 'active').single()
  if (staff) return { role: staff.role as UserProfile['role'], staffId: staff.id, name: staff.name, email: staff.email }

  const { data: parent } = await supabase
    .from('parents').select('id, name, email')
    .eq('user_id', user.id).single()
  if (parent) return { role: 'parent', parentId: parent.id, name: parent.name, email: parent.email }

  const { data: staffByEmail } = await supabase
    .from('staff').select('id, name, email, role')
    .eq('email', user.email || '').eq('status', 'active').single()
  if (staffByEmail) {
    await supabase.from('staff').update({ user_id: user.id }).eq('id', staffByEmail.id)
    return { role: staffByEmail.role as UserProfile['role'], staffId: staffByEmail.id, name: staffByEmail.name, email: staffByEmail.email }
  }

  const { data: parentByEmail } = await supabase
    .from('parents').select('id, name, email')
    .eq('email', user.email || '').single()
  if (parentByEmail) {
    await supabase.from('parents').update({ user_id: user.id }).eq('id', parentByEmail.id)
    return { role: 'parent', parentId: parentByEmail.id, name: parentByEmail.name, email: parentByEmail.email }
  }

  const { count } = await supabase.from('staff').select('*', { count: 'exact', head: true })
  if (count === 0) {
    const { data: newStaff } = await supabase.from('staff').insert({
      name: user.email?.split('@')[0] || 'Admin', email: user.email || '',
      role: 'principal', status: 'active', user_id: user.id,
    }).select('id, name, email, role').single()
    if (newStaff) return { role: 'principal', staffId: newStaff.id, name: newStaff.name, email: newStaff.email }
  }

  return null
}

export async function getCurrentStaffId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('id').eq('user_id', user.id).single()
  return data?.id ?? null
}

export async function logAuditEvent(action: string, targetTable: string, targetId?: string, details?: Record<string, unknown>) {
  const supabase = await createClient()
  const actorId = await getCurrentStaffId()
  if (!actorId) return
  await supabase.from('audit_log').insert({
    actor_id: actorId, action, target_table: targetTable,
    target_id: targetId || null, details: details || null,
  })
}
