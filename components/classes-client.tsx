'use client'

import Link from 'next/link'
import { useState, useMemo, useTransition } from 'react'
import { deleteClass, saveClass } from '@/app/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { ConfirmDialog, EmptyState, Field, Modal, Spinner, btnOutline, btnPrimary, inputCls } from '@/components/ui'
import type { ClassRow, StudentRow } from '@/lib/types'

export function ClassesClient({ classes, students, error }: { classes: ClassRow[]; students: StudentRow[]; error?: string }) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [classModal, setClassModal] = useState<{ open: boolean; edit?: ClassRow }>({ open: false })
  const [removing, setRemoving] = useState<ClassRow | null>(null)
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
        <button className={btnPrimary} onClick={() => setClassModal({ open: true })} disabled={pending}>
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
            <div key={c.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md hover:border-primary transition-all">
              <div className="flex items-center justify-between gap-2 mb-3">
                <Link href={`/classes/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-base shrink-0">{c.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <h3 className="text-title-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{c.name}</h3>
                    {c.section && <p className="text-body-sm text-on-surface-variant">{c.section}</p>}
                  </div>
                </Link>
                <CardMenu onEdit={() => setClassModal({ open: true, edit: c })} onRemove={() => setRemoving(c)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-primary-fixed text-on-primary-fixed-variant text-label-md px-2.5 py-1 rounded-full">{studentCount.get(c.id) ?? 0} students</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClassModal
        key={classModal.edit?.id ?? 'new'}
        open={classModal.open}
        edit={classModal.edit}
        busy={pending}
        onClose={() => setClassModal({ open: false })}
        onSubmit={v => {
          startTransition(async () => {
            const res = await saveClass(v)
            if (res.error) toast('error', res.error)
            else { toast('success', v.id ? 'Class updated' : 'Class created'); setClassModal({ open: false }) }
          })
        }}
      />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          const c = removing
          setRemoving(null)
          if (!c) return
          startTransition(async () => {
            const res = await deleteClass(c.id)
            if (res.error) toast('error', res.error)
            else toast('success', 'Class removed successfully')
          })
        }}
        title="Remove class"
        message={removing ? (studentCount.get(removing.id) ?? 0) > 0
          ? `This class has ${studentCount.get(removing.id)} students. Removing it will also unassign/affect their records. Are you sure?`
          : `Remove class '${removing.name}${removing.section ? ' / ' + removing.section : ''}'? This cannot be undone.`
          : ''}
        confirmLabel="Remove"
        danger
      />
    </div>
  )
}

function CardMenu({ onEdit, onRemove }: { onEdit: () => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button aria-label="Class actions" onClick={() => setOpen(o => !o)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full">
        <Icon name="more_vert" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-surface-container-lowest rounded-lg border border-outline-variant/50 shadow-xl py-1">
            <button onClick={() => { setOpen(false); onEdit() }} className="w-full flex items-center gap-2 px-3 py-2 text-left text-body-md hover:bg-primary-fixed">
              <Icon name="edit" className="text-base" /> Edit
            </button>
            <button onClick={() => { setOpen(false); onRemove() }} className="w-full flex items-center gap-2 px-3 py-2 text-left text-body-md text-error hover:bg-error-container">
              <Icon name="delete" className="text-base" /> Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AddClassModal({ open, edit, busy, onClose, onSubmit }: {
  open: boolean; edit?: ClassRow; busy: boolean
  onClose: () => void; onSubmit: (v: { name: string; section: string; id?: string }) => void
}) {
  const [name, setName] = useState(edit?.name ?? '')
  const [section, setSection] = useState(edit?.section ?? '')
  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Edit Class' : 'Add Class'}>
      <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit({ name, section, id: edit?.id }) }} noValidate>
        <Field label="Class Name">
          <input className={inputCls} placeholder="Grade 5" value={name} onChange={e => setName(e.target.value)} required autoFocus disabled={busy} />
        </Field>
        <Field label="Section">
          <input className={inputCls} placeholder="A (optional)" value={section} onChange={e => setSection(e.target.value)} disabled={busy} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? <Spinner /> : <Icon name="check" />} {edit ? 'Save Changes' : 'Create Class'}
          </button>
        </div>
      </form>
    </Modal>
  )
}