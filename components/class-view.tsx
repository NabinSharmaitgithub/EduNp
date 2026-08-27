"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteStudent, saveStudent, type StudentInput } from "@/app/actions";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Avatar, EmptyState, Field, GradePill, Modal, Progress, Spinner, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { computeStudentStats } from "@/lib/stats";
import { BLOOD_GROUPS } from "@/lib/types";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export function ClassView({
  cls,
  students,
  marks,
  subjects,
}: {
  cls: ClassRow;
  students: StudentRow[];
  marks: MarkRow[];
  subjects: SubjectRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"roll" | "name" | "avg">("roll");
  const [modal, setModal] = useState<{ open: boolean; student?: StudentRow }>({ open: false });

  const classMarks = useMemo(() => marks.filter((m) => students.some((s) => s.id === m.student_id)), [marks, students]);
  const stats = useMemo(() => computeStudentStats(students, classMarks), [students, classMarks]);
  const pctById = useMemo(() => new Map(stats.map((s) => [s.student.id, s.pct])), [stats]);

  const visible = useMemo(() => {
    let rows = stats.filter((s) =>
      `${s.student.name} ${s.student.roll_number}`.toLowerCase().includes(search.toLowerCase()),
    );
    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.student.name.localeCompare(b.student.name);
      if (sort === "avg") return (b.pct ?? -1) - (a.pct ?? -1);
      return a.student.roll_number.localeCompare(b.student.roll_number, undefined, { numeric: true });
    });
    return rows;
  }, [stats, search, sort]);

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast("error", res.error);
      else toast("success", okMsg);
    });
  }

  function remove(s: StudentRow) {
    if (!confirm(`Remove ${s.name} and all their marks?`)) return;
    // optimistic: nothing to patch locally (server refetch), but keep UI responsive via pending state
    run(() => deleteStudent(s.id, cls.id), `${s.name} removed`);
  }

  return (
    <>
      <header className="h-16 px-6 bg-surface flex justify-between items-center sticky top-0 z-40 border-b border-outline-variant/30">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Link href="/admin" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <span className="text-on-surface font-medium">{cls.name}</span>
        </nav>
      </header>

      <div className={`flex-1 p-6 max-w-content mx-auto w-full transition-opacity ${pending ? "opacity-70" : ""}`}>
        {/* Class header card */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <div>
              <h1 className="text-headline-md">{cls.name}</h1>
              <p className="text-body-sm text-on-surface-variant">
                Section {cls.section || "—"} · {students.length} student{students.length === 1 ? "" : "s"} ·{" "}
                {subjects.length} subject{subjects.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/classes/${cls.id}/report`} className={btnOutline}>
              <Icon name="assessment" /> Report
            </Link>
            <button className={btnPrimary} onClick={() => setModal({ open: true })}>
              <Icon name="person_add" /> Add Student
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select aria-label="Sort order" className={`${inputCls} sm:w-44`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="roll">Sort by Roll No</option>
            <option value="name">Sort by Name</option>
            <option value="avg">Sort by Average</option>
          </select>
        </div>

        {/* Students table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          {visible.length === 0 ? (
            <EmptyState
              icon="🧑‍🎓"
              title={students.length === 0 ? "No students yet" : "No matches"}
              hint={students.length === 0 ? 'Click "Add Student" to enroll the first student.' : "Try a different search."}
            />
          ) : (
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">Student</th>
                  <th className="py-4 px-6 font-medium">Roll No</th>
                  <th className="py-4 px-6 font-medium">Average Score</th>
                  <th className="py-4 px-6 font-medium">Grade</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {visible.map((row) => (
                  <tr
                    key={row.student.id}
                    onClick={() => router.push(`/students/${row.student.id}`)}
                    className="hover:bg-primary-container/5 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.student.name} />
                        <span className="font-medium">{row.student.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">{row.student.roll_number}</td>
                    <td className="py-4 px-6 w-56"><Progress pct={row.pct} /></td>
                    <td className="py-4 px-6"><GradePill pct={row.pct} /></td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        aria-label={`Edit ${row.student.name}`}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full transition-colors"
                        onClick={() => setModal({ open: true, student: row.student })}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        aria-label={`Delete ${row.student.name}`}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                        onClick={() => remove(row.student)}
                      >
                        <Icon name="delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {visible.length > 0 && (
          <p className="mt-3 text-body-sm text-outline">Click a row to open the student profile.</p>
        )}
      </div>

      <StudentModal
        key={modal.student?.id ?? "new"}
        open={modal.open}
        initial={modal.student}
        onClose={() => setModal({ open: false })}
        onSubmit={(v) => {
          run(
            () => saveStudent({ ...v, class_id: cls.id }),
            v.id ? "Student updated" : `${v.name} added`,
          );
          setModal({ open: false });
        }}
      />
    </>
  );
}

function StudentModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: StudentInput) => void;
  initial?: StudentRow;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [roll, setRoll] = useState(initial?.roll_number ?? "");
  const [dob, setDob] = useState(initial?.date_of_birth ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [fatherName, setFatherName] = useState(initial?.father_name ?? "");
  const [fatherOcc, setFatherOcc] = useState(initial?.father_occupation ?? "");
  const [motherName, setMotherName] = useState(initial?.mother_name ?? "");
  const [motherOcc, setMotherOcc] = useState(initial?.mother_occupation ?? "");
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardian_contact_number ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(initial?.emergency_contact_number ?? "");
  const [address, setAddress] = useState(initial?.student_address ?? "");
  const [iems, setIems] = useState(initial?.iems_number ?? "");
  const [admissionDate, setAdmissionDate] = useState(initial?.admission_date ?? "");
  const [bloodGroup, setBloodGroup] = useState(initial?.blood_group ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required.";
    if (!roll.trim()) errs.roll = "Roll number is required.";
    if (guardianPhone && !/^\d{7,15}$/.test(guardianPhone)) errs.guardianPhone = "Must be 7-15 digits.";
    if (emergencyPhone && !/^\d{7,15}$/.test(emergencyPhone)) errs.emergencyPhone = "Must be 7-15 digits.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({
      id: initial?.id, name, roll_number: roll,
      date_of_birth: dob || undefined, gender: gender || undefined,
      father_name: fatherName || undefined, father_occupation: fatherOcc || undefined,
      mother_name: motherName || undefined, mother_occupation: motherOcc || undefined,
      guardian_contact_number: guardianPhone || undefined, emergency_contact_number: emergencyPhone || undefined,
      student_address: address || undefined, iems_number: iems || undefined,
      admission_date: admissionDate || undefined, blood_group: bloodGroup || undefined,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Student" : "Add Student"}>
      <form className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2" onSubmit={submit} noValidate>
        <h4 className="text-title-sm font-semibold text-primary">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" error={errors.name}>
            <input className={inputCls} placeholder="Ava Thompson" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Roll Number" error={errors.roll}>
            <input className={inputCls} placeholder="12" value={roll} onChange={(e) => setRoll(e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="IEMS Number">
            <input className={inputCls} placeholder="Unique student ID" value={iems} onChange={(e) => setIems(e.target.value)} />
          </Field>
          <Field label="Blood Group">
            <select className={inputCls} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">Select…</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </Field>
          <Field label="Admission Date">
            <input type="date" className={inputCls} value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputCls} placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>

        <h4 className="text-title-sm font-semibold text-primary mt-2">Parent / Guardian</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Father's Name">
            <input className={inputCls} value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
          </Field>
          <Field label="Father's Occupation">
            <input className={inputCls} value={fatherOcc} onChange={(e) => setFatherOcc(e.target.value)} />
          </Field>
          <Field label="Mother's Name">
            <input className={inputCls} value={motherName} onChange={(e) => setMotherName(e.target.value)} />
          </Field>
          <Field label="Mother's Occupation">
            <input className={inputCls} value={motherOcc} onChange={(e) => setMotherOcc(e.target.value)} />
          </Field>
          <Field label="Guardian Contact" error={errors.guardianPhone}>
            <input className={inputCls} placeholder="Phone number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
          </Field>
          <Field label="Emergency Contact" error={errors.emergencyPhone}>
            <input className={inputCls} placeholder="Phone number (optional)" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>
            <Icon name="check" />
            {initial ? "Save Changes" : "Add Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
