'use client'

import { useState, useTransition } from 'react'
import { createAnnouncement, deleteAnnouncement } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { AnnouncementRow, ClassRow } from '@/lib/types'

export function AnnouncementsClient({ announcements, classes, readOnly, error }: { announcements: AnnouncementRow[]; classes: ClassRow[]; readOnly?: boolean; error?: string }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [addModal, setAddModal] = useState(false)

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => { const r = await fn(); if (r.error) toast('error', r.error); else toast('success', okMsg) })
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg">Announcements</h1>
        {!readOnly && <button className={btnPrimary} onClick={() => setAddModal(true)}><Icon name="add" /> New Announcement</button>}
      </div>
      {error && <p className="mb-4 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      {announcements.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="📢" title="No announcements" hint="Post your first announcement." />
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-title-lg">{a.title}</h3>
                    <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2 py-1 rounded-full capitalize">{a.target}</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{a.body}</p>
                  <p className="text-body-sm text-on-surface-variant/70 mt-3">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                {!readOnly && (
                  <button aria-label="Delete announcement" className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full" onClick={() => run(() => deleteAnnouncement(a.id), 'Deleted')}>
                    <Icon name="delete" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnnouncementModal open={addModal} classes={classes} onClose={() => setAddModal(false)} onSubmit={v => { run(() => createAnnouncement(v), 'Announcement posted'); setAddModal(false) }} />
    </div>
  )
}

function AnnouncementModal({ open, classes, onClose, onSubmit }: { open: boolean; classes: ClassRow[]; onClose: () => void; onSubmit: (v: any) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('school')
  const [classId, setClassId] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="New Announcement">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ title, body, target, class_id: target === 'class' ? classId : undefined }) }} noValidate>
        <Field label="Title"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} required /></Field>
        <Field label="Message"><textarea className={inputCls + ' min-h-[100px]'} value={body} onChange={e => setBody(e.target.value)} required /></Field>
        <Field label="Target">
          <select className={inputCls} value={target} onChange={e => setTarget(e.target.value)}>
            <option value="school">All School</option>
            <option value="class">Specific Class</option>
          </select>
        </Field>
        {target === 'class' && <Field label="Class"><select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)} required><option value="">Select…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
        <div className="flex justify-end gap-2 mt-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Post</button></div>
      </form>
    </Modal>
  )
}
