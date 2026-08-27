'use client'

import Link from 'next/link'
import { useState, useMemo, useTransition } from 'react'
import { saveClass } from '@/app/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { ClassRow, StudentRow } from '@/lib/types'

export function ClassesClient({ classes, students, error }: { classes: ClassRow[]; students: StudentRow[]; error?: string }) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [pending, startTransition] = useTransition()

  const studentCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1)
    return map
  }, [students])

  const filtered = useMemo(() =>
    search ? classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : classes,
    [classes, search],
  )

  return (
    <div className="max-w-content mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-semibold">Classes</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{classes.length} class{classes.length === 1 ? '' : 'es'} in the school</p>
        </div>
        <button className={btnPrimary} onClick={() => setAddModal(true)} disabled={pending}>
          <Icon name="add_circle" /> Add Class
        </button>
      </div>

      {error && <p className="text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search classes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
          <EmptyState icon="school" title={search ? 'No matches' : 'No classes yet'} hint={search ? 'Try a different search.' : 'Click "Add Class" to create the first one.'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link key={c.id} href={`/classes/${c.id}`} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md hover:border-primary transition-all group block">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-base">{c.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-title-md font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                    {c.section && <p className="text-body-sm text-on-surface-variant">{c.section}</p>}
                  </div>
                </div>
                <Icon name="chevron_right" className="text-on-surface-variant group-hover:text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2.5 py-1 rounded-full">{studentCount.get(c.id) ?? 0} students</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AddClassModal open={addModal} onClose={() => setAddModal(false)} onSubmit={v => {
        startTransition(async () => {
          const res = await saveClass(v)
          if (res.error) toast('error', res.error)
          else { toast('success', v.id ? 'Class updated' : 'Class created'); setAddModal(false) }
        })
      }} />
    </div>
  )
}

function AddClassModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (v: { name: string; section: string; id?: string }) => void }) {
  const [name, setName] = useState('')
  const [section, setSection] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Add Class">
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ name, section }) }} noValidate>
        <Field label="Class Name">
          <input className={inputCls} placeholder="Grade 5" value={name} onChange={e => setName(e.target.value)} required autoFocus />
        </Field>
        <Field label="Section">
          <input className={inputCls} placeholder="A (optional)" value={section} onChange={e => setSection(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}><Icon name="check" /> Create Class</button>
        </div>
      </form>
    </Modal>
  )
}