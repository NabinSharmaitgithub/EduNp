'use client'

import { useEffect, useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { sb } from '@/lib/supabase/client'
import { useToast } from '@/components/toast'
import { Icon } from '@/components/icon'
import { Spinner, btnOutline, Field } from '@/components/ui'

const BUCKET = 'profile-photos'
const MAX_RAW = 10 * 1024 * 1024
const MAX_FINAL = 200 * 1024

function extFor(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

export function PhotoField({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  function showPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url
    setPreview(url)
  }
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }, [])

  async function select(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('error', 'Please choose an image file'); return }
    if (file.size > MAX_RAW) { toast('error', 'Image is too large. Maximum raw size is 10MB.'); return }
    try {
      let out = file
      if (file.size > MAX_FINAL) {
        setBusy(true); setStatus('Compressing image…')
        out = await imageCompression(file, {
          maxSizeMB: 0.19,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: 'image/jpeg',
        })
        if (out.size > MAX_FINAL) {
          toast('error', 'Image is too large even after compression — please choose a simpler image or crop it first')
          return
        }
      }
      showPreview(URL.createObjectURL(out))
      setStatus('Uploading…')
      const { data, error } = await sb().storage.from(BUCKET).upload(
        `${crypto.randomUUID()}.${extFor(out.type)}`,
        out,
        { contentType: out.type, cacheControl: '3600', upsert: true },
      )
      if (error) throw error
      onChange(sb().storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl)
      toast('success', 'Photo uploaded')
    } catch (err) {
      toast('error', 'Photo upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setBusy(false); setStatus('')
    }
  }

  return (
    <Field label="Profile Photo">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shrink-0">
          {value ?? preview
            ? <img src={value ?? preview!} alt="Profile preview" className="w-full h-full object-cover" />
            : <Icon name="person" className="text-on-primary-fixed-variant text-2xl" />}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={select} disabled={busy} />
            <button type="button" className={btnOutline} onClick={() => inputRef.current?.click()} disabled={busy}>
              <Icon name="photo_camera" /> {value ? 'Change Photo' : 'Add Photo'}
            </button>
            {value !== null && !busy && (
              <button type="button" className={btnOutline} onClick={() => { onChange(null); showPreview(null) }}>
                <Icon name="delete" /> Remove
              </button>
            )}
          </div>
          {busy && <span className="text-body-sm text-on-surface-variant flex items-center gap-1"><Spinner />{status}</span>}
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mt-1">Photos over 200KB are compressed automatically. Maximum raw size is 10MB.</p>
    </Field>
  )
}