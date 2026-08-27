'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { ClassRow, StudentRow, SubjectRow, TeacherSubjectAssignment } from '@/lib/types'

interface Props {
  classes: ClassRow[]; students: StudentRow[]; subjectAssignments: TeacherSubjectAssignment[]; subjects: SubjectRow[]
}

export function TeacherClassesClient({ classes, students, subjectAssignments, subjects }: Props) {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects])

  const studentCountByClass = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of students) map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1)
    return map
  }, [students])

  const subjectsByClass = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const a of subjectAssignments) {
      if (!map.has(a.class_id)) map.set(a.class_id, [])
      map.get(a.class_id)!.push(subjectMap.get(a.subject_id) ?? '—')
    }
    return map
  }, [subjectAssignments, subjectMap])

  if (classes.length === 0) return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">My Classes</h1>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-2xl">📚</div>
          <p className="text-title-lg">No classes assigned yet</p>
          <p className="text-body-md text-on-surface-variant max-w-xs">Contact the principal to get class assignments.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg mb-6">My Classes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(c => {
          const classSubjects = subjectsByClass.get(c.id) ?? []
          return (
            <Link key={c.id} href={`/teacher/classes/${c.id}`} className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-5 hover:shadow-md transition-shadow group block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-base">{c.name.charAt(0)}</div>
                <div>
                  <h3 className="text-title-md font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
                  {c.section && <p className="text-body-sm text-on-surface-variant">{c.section}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-body-sm text-on-surface-variant"><span className="font-medium text-on-surface">{studentCountByClass.get(c.id) ?? 0}</span> students</p>
                {classSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {classSubjects.map((name, i) => (
                      <span key={i} className="text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">{name}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
