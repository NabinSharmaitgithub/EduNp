'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { Field, Spinner, btnPrimary, inputCls } from '@/components/ui'
import { completePasswordChange, roleHome } from '@/app/actions'

export default function SetPasswordPage() {
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      const supabase = sb()

      const { error: pwErr } = await supabase.auth.updateUser({ password })
      if (pwErr) {
        toast('error', pwErr.message)
        return
      }

      const res = await completePasswordChange()
      const role = res.role

      // Refresh the client-side session so route guards see the updated flag
      await supabase.auth.getUser()

      toast('success', 'Password updated!')

      const dest = await roleHome(role)
      router.replace(dest)
    } catch {
      toast('error', 'Failed to update password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-6 shadow-bloom border border-outline-variant/50">
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant text-2xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-headline-md mb-1">Set New Password</h2>
          <p className="text-body-sm text-on-surface-variant">
            This is your first login. Please set a new password to continue.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <Field label="New Password" error={errors.password}>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm Password" error={errors.confirm}>
            <input
              type="password"
              autoComplete="new-password"
              className={inputCls}
              placeholder="Re-enter password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </Field>

          <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 w-full`}>
            {busy && <Spinner />}
            Set Password & Continue
          </button>
        </form>
      </div>
    </main>
  )
}
