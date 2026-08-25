'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { saveStudent, saveMark } from '@/app/actions'
import { Field, btnPrimary, btnOutline, inputCls, Spinner } from '@/components/ui'
import { useToast } from '@/components/toast'
import type { ClassRow, SubjectRow } from '@/lib/types'

type ImportType = 'students' | 'marks'

export function ImportClient({ classes, subjects }: { classes: ClassRow[]; subjects: SubjectRow[] }) {
  const toast = useToast()
  const [type, setType] = useState<ImportType>('students')
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [term, setTerm] = useState('Midterm')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setResult(null)

    const text = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
    const rows = parsed.data
    const errors: string[] = []
    let imported = 0

    if (type === 'students') {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const name = r.name?.trim()
        const roll_number = r.roll_number?.trim()
        if (!name || !roll_number) { errors.push(`Row ${i + 1}: missing name or roll_number`); continue }
        const res = await saveStudent({ name, roll_number, class_id: classId })
        if (res.error) errors.push(`Row ${i + 1}: ${res.error}`)
        else imported++
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const student_roll = r.roll_number?.trim()
        const marks = Number(r.marks_obtained)
        const max = Number(r.max_marks || 100)
        if (!student_roll || isNaN(marks)) { errors.push(`Row ${i + 1}: missing roll_number or marks`); continue }
        const res = await saveMark({ student_id: student_roll, subject_id: subjectId, exam_term: term, marks_obtained: marks, max_marks: max })
        if (res.error) errors.push(`Row ${i + 1}: ${res.error}`)
        else imported++
      }
    }

    setBusy(false)
    setResult({ imported, errors })
    if (errors.length === 0) toast('success', `${imported} records imported`)
    else toast('error', `${errors.length} errors during import`)
    e.target.value = ''
  }

  return (
    <div className="max-w-content mx-auto w-full">
      <h1 className="text-headline-lg mb-6">Import Data</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 max-w-lg">
        <div className="flex gap-3 mb-6">
          {(['students', 'marks'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setResult(null) }} className={`px-4 py-2 rounded-lg text-body-md font-medium capitalize transition-colors ${type === t ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'}`}>
              {t}
            </button>
          ))}
        </div>

        {type === 'students' ? (
          <div className="flex flex-col gap-4 mb-6">
            <Field label="Target Class">
              <select className={inputCls} value={classId} onChange={e => setClassId(e.target.value)}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <p className="text-body-sm text-on-surface-variant">CSV columns: <code>name, roll_number</code></p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            <Field label="Subject">
              <select className={inputCls} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Exam Term">
              <input className={inputCls} value={term} onChange={e => setTerm(e.target.value)} />
            </Field>
            <p className="text-body-sm text-on-surface-variant">CSV columns: <code>roll_number, marks_obtained, max_marks</code></p>
          </div>
        )}

        <label className={btnPrimary + ' cursor-pointer inline-flex'}>
          {busy ? <><Spinner /> Importing…</> : <><span className="material-symbols-outlined">upload_file</span> Choose CSV File</>}
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={busy} />
        </label>

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-surface-container-high">
            <p className="font-semibold">Imported: {result.imported}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-body-sm text-on-error-container list-disc pl-4">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
