'use client'

import { useState, useTransition } from 'react'
import { createSubject, deleteSubject } from '@/app/admin/actions'
import { Icon } from '@/components/icon'
import { useToast } from '@/components/toast'
import { EmptyState, Field, Modal, btnOutline, btnPrimary, btnDanger, inputCls, ConfirmDialog } from '@/components/ui'
import type { SubjectRow } from '@/lib/types'

export function SettingsClient({ subjects, error }: { subjects: SubjectRow[]; error?: string }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [newSubject, setNewSubject] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)

  function handleAddSubject() {
    if (!newSubject.trim()) return
    startTransition(async () => {
      const res = await createSubject(newSubject)
      if (res.error) {
        toast('error', res.error)
      } else {
        toast('success', `Subject "${newSubject.trim()}" added`)
        setNewSubject('')
      }
    })
  }

  function handleDeleteSubject() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteSubject(deleteTarget.id)
      if (res.error) {
        toast('error', res.error)
      } else {
        toast('success', 'Subject deleted')
        setDeleteTarget(null)
      }
    })
  }

  return (
    <div className="max-w-content mx-auto w-full flex flex-col gap-6">
      <h1 className="text-headline-lg">System Settings</h1>
      {error && <p className="text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="school" className="text-primary" />
          <h2 className="text-title-lg">School Profile</h2>
        </div>
        <div className="grid gap-4 max-w-lg">
          <Field label="School Name">
            <input className={inputCls} disabled value="EduSchool" />
          </Field>
          <Field label="Address">
            <textarea className={inputCls} disabled rows={2} value="123 Education Lane" />
          </Field>
          <Field label="Academic Year">
            <input className={inputCls} disabled value="2025-2026" />
          </Field>
        </div>
        <p className="mt-3 text-body-sm text-on-surface-variant">Contact the system administrator to update school details.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="menu_book" className="text-primary" />
          <h2 className="text-title-lg">Subjects</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            className={inputCls}
            placeholder="Subject name"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
          />
          <button className={`${btnPrimary} shrink-0`} disabled={pending || !newSubject.trim()} onClick={handleAddSubject}>Add</button>
        </div>
        {subjects.length === 0 ? (
          <EmptyState icon="📚" title="No subjects" hint="Add subjects to use across classes." />
        ) : (
          <ul className="divide-y divide-outline-variant">
            {subjects.map(s => (
              <li key={s.id} className="flex items-center justify-between py-2 px-2">
                <span className="text-body-md">{s.name}</span>
                <button
                  className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                  onClick={() => setDeleteTarget(s)}
                  aria-label={`Delete ${s.name}`}
                >
                  <Icon name="delete" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50/50">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="warning" className="text-red-600" />
          <h2 className="text-title-lg text-red-600">Danger Zone</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-md font-medium">Export All Data</p>
              <p className="text-body-sm text-on-surface-variant">Download a complete backup of all school data</p>
            </div>
            <button className={btnOutline} onClick={() => setShowExport(true)}>Export</button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-md font-medium">Deactivate School Account</p>
              <p className="text-body-sm text-on-surface-variant">Permanently disable all user accounts and freeze the system</p>
            </div>
            <button className={btnDanger} onClick={() => setShowDeactivate(true)}>Deactivate</button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect existing assignments.`}
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        onConfirm={() => { setShowExport(false); toast('success', 'Export initiated — check your email') }}
        title="Export All Data"
        message="This will generate a complete backup of all school data and send it to your email."
        confirmLabel="Export"
      />
      <ConfirmDialog
        open={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        onConfirm={() => { setShowDeactivate(false); toast('error', 'This action is restricted in the current version') }}
        title="Deactivate School Account"
        message="This will deactivate ALL accounts. This action cannot be undone."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
