"use client";

import Link from "next/link";
import { startTransition as reactStartTransition, useMemo, useState, useTransition } from "react";
import { deleteMark, saveMark, updateMarkValue } from "@/app/actions";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Avatar,
  EmptyState,
  Field,
  GradePill,
  Progress,
  Spinner,
  btnOutline,
  btnPrimary,
  inputCls,
} from "@/components/ui";
import { EXAM_TERMS } from "@/lib/types";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

export function StudentView({
  student,
  cls,
  marks: initialMarks,
  subjects,
}: {
  student: StudentRow;
  cls: ClassRow | null;
  marks: MarkRow[];
  subjects: SubjectRow[];
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"marks" | "report">("marks");
  // local mirror of marks so edits feel instant; server refresh keeps it honest
  const [marks, setMarks] = useState(initialMarks);

  const subjectName = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects]);

  const totals = useMemo(() => {
    const total = marks.reduce((a, m) => a + Number(m.marks_obtained), 0);
    const max = marks.reduce((a, m) => a + Number(m.max_marks), 0);
    return { total, max, pct: max > 0 ? (total / max) * 100 : null };
  }, [marks]);

  const bySubject = useMemo(() => {
    const map = new Map<string, { obtained: number; max: number }>();
    for (const m of marks) {
      const cur = map.get(m.subject_id) ?? { obtained: 0, max: 0 };
      cur.obtained += Number(m.marks_obtained);
      cur.max += Number(m.max_marks);
      map.set(m.subject_id, cur);
    }
    return [...map.entries()];
  }, [marks]);

  function run(fn: () => Promise<{ error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast("error", res.error);
      else toast("success", okMsg);
    });
  }

  return (
    <>
      <header className="h-16 px-6 bg-surface flex items-center sticky top-0 z-40 border-b border-outline-variant/30">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant flex-wrap">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          {cls && (
            <>
              <span>/</span>
              <Link href={`/classes/${cls.id}`} className="hover:text-primary">{cls.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-on-surface font-medium">{student.name}</span>
        </nav>
      </header>

      <div className={`flex-1 p-6 max-w-content mx-auto w-full transition-opacity ${pending ? "opacity-70" : ""}`}>
        {/* Profile header */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size="lg" />
            <div>
              <h1 className="text-headline-md">{student.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <Chip>Roll No {student.roll_number}</Chip>
                {cls && <Chip>{cls.name}</Chip>}
                <GradePill pct={totals.pct} />
              </div>
            </div>
          </div>
          <button
            className={`${btnOutline} self-start no-print`}
            onClick={() => setTab("report")}
            title="View printable report card"
          >
            Report Card →
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-outline-variant mb-6">
          {(["marks", "report"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 -mb-px text-title-lg capitalize transition-colors ${
                tab === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {t === "marks" ? "Marks" : "Report Card"}
            </button>
          ))}
        </div>

        {tab === "marks" ? (
          <MarksTab
            student={student}
            cls={cls}
            marks={marks}
            setMarks={setMarks}
            subjects={subjects}
            subjectName={subjectName}
            run={run}
          />
        ) : (
          <ReportTab
            clsId={cls?.id}
            student={student}
            marks={marks}
            subjectName={subjectName}
            totals={totals}
            bySubject={bySubject}
          />
        )}
      </div>
    </>
  );
}

/* ---------------- Marks tab ---------------- */

function MarksTab({
  student,
  cls,
  marks,
  setMarks,
  subjects,
  subjectName,
  run,
}: {
  student: StudentRow;
  cls: ClassRow | null;
  marks: MarkRow[];
  setMarks: React.Dispatch<React.SetStateAction<MarkRow[]>>;
  subjects: SubjectRow[];
  subjectName: Record<string, string>;
  run: (fn: () => Promise<{ error?: string }>, okMsg: string) => void;
}) {
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const terms = useMemo(
    () => [...new Set([...EXAM_TERMS, ...marks.map((m) => m.exam_term)])],
    [marks],
  );

  const visible = filterTerm === "all" ? marks : marks.filter((m) => m.exam_term === filterTerm);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
      {/* Add mark form */}
      <AddMarkCard studentId={student.id} subjects={subjects} terms={[...terms]} existing={marks} run={run} />

      {/* Recorded marks */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-outline-variant/30">
          <h3 className="text-headline-sm font-bold">Recorded Marks</h3>
          <select className={`${inputCls} w-44`} value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
            <option value="all">All Exam Terms</option>
            {terms.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon="📝" title="No marks recorded" hint="Use the form to add the first mark." />
        ) : (
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-6 font-medium">Subject</th>
                <th className="py-3 px-6 font-medium">Exam Term</th>
                <th className="py-3 px-6 font-medium">Score</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((m) =>
                editingId === m.id ? (
                  <tr key={m.id} className="bg-primary-fixed/30">
                    <td className="py-3 px-6 font-medium">{subjectName[m.subject_id]}</td>
                    <td className="py-3 px-6 text-on-surface-variant">{m.exam_term}</td>
                    <td className="py-3 px-6">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={m.max_marks}
                        step="0.5"
                        className="w-24 px-2 py-1 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                      />
                      <span className="text-on-surface-variant ml-1">/{m.max_marks}</span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        className="text-primary hover:underline mr-3"
                        onClick={() => {
                          const v = parseFloat(editVal);
                          if (isNaN(v) || v < 0 || v > m.max_marks) {
                            toast("error", `Score must be between 0 and ${m.max_marks}.`);
                            return;
                          }
                          const prev = marks;
                          setMarks(marks.map((x) => (x.id === m.id ? { ...x, marks_obtained: v } : x)));
                          setEditingId(null);
                          reactStartTransition(async () => {
                            const res = await updateMarkValue(m.id, v, student.id, cls?.id ?? "");
                            if (res.error) {
                              setMarks(prev);
                              toast("error", res.error);
                            } else toast("success", "Mark updated");
                          });
                        }}
                      >
                        Save
                      </button>
                      <button className="text-on-surface-variant hover:underline" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="hover:bg-primary-container/5 transition-colors group">
                    <td className="py-3 px-6 font-medium">{subjectName[m.subject_id] ?? "Unknown"}</td>
                    <td className="py-3 px-6 text-on-surface-variant">
                      <span className="bg-surface-container-high text-on-surface-variant text-label-md px-2 py-0.5 rounded-full">
                        {m.exam_term}
                      </span>
                    </td>
                    <td className="py-3 px-6 w-56"><Progress pct={(Number(m.marks_obtained) / Number(m.max_marks)) * 100} /></td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <button
                        aria-label="Edit mark"
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-full transition-colors"
                        onClick={() => { setEditingId(m.id); setEditVal(String(m.marks_obtained)); }}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        aria-label="Delete mark"
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors"
                        onClick={() => {
                          if (!confirm("Delete this mark?")) return;
                          const prev = marks;
                          setMarks(marks.filter((x) => x.id !== m.id)); // optimistic
                          run(async () => {
                            const res = await deleteMark(m.id, student.id);
                            if (res.error) {
                              setMarks(prev);
                              return res;
                            }
                            return {};
                          }, "Mark deleted");
                        }}
                      >
                        <Icon name="delete" />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AddMarkCard({
  studentId,
  subjects,
  terms,
  existing,
  run,
}: {
  studentId: string;
  subjects: SubjectRow[];
  terms: string[];
  existing: MarkRow[];
  run: (fn: () => Promise<{ error?: string }>, okMsg: string) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState(terms[0] ?? "Term 1");
  const [score, setScore] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [errors, setErrors] = useState<{ subject?: string; term?: string; score?: string; dup?: string }>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!subjectId) errs.subject = "Pick a subject.";
    if (!term.trim()) errs.term = "Exam term is required.";
    const v = parseFloat(score);
    const mx = parseFloat(maxMarks);
    if (isNaN(v)) errs.score = "Score is required.";
    else if (v < 0) errs.score = "Score can't be negative.";
    else if (!isNaN(mx) && v > mx) errs.score = `Score can't exceed ${mx}.`;
    if (
      !errs.subject &&
      !errs.term &&
      !errs.score &&
      existing.some((m) => m.subject_id === subjectId && m.exam_term === term.trim())
    )
      errs.dup = "A mark for this subject & term already exists — edit it in the table instead.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const res = await saveMark({
      student_id: studentId,
      subject_id: subjectId,
      exam_term: term.trim(),
      marks_obtained: v,
      max_marks: mx,
    });
    setBusy(false);
    if (res.error) toast("error", res.error);
    else {
      toast("success", "Mark saved");
      setScore("");
      setErrors({});
    }
  }

  return (
    <form onSubmit={submit} noValidate className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-6 flex flex-col gap-4 lg:sticky lg:top-24">
      <h3 className="text-headline-sm font-bold">Add New Mark</h3>
      <Field label="Subject" error={errors.subject}>
        <select className={inputCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Exam Term" error={errors.term ?? errors.dup}>
        <input
          className={inputCls}
          list="exam-terms"
          placeholder="Term 1"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <datalist id="exam-terms">
          {terms.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Score" error={errors.score}>
          <input type="number" step="0.5" min={0} className={inputCls} placeholder="87" value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>
        <Field label="Max Marks">
          <input type="number" step="1" min={1} className={inputCls} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
        </Field>
      </div>
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy && <Spinner />}
        Save Mark
      </button>
    </form>
  );
}

/* ---------------- Report card tab ---------------- */

function ReportTab({
  student,
  marks,
  subjectName,
  totals,
  bySubject,
}: {
  clsId?: string;
  student: StudentRow;
  marks: MarkRow[];
  subjectName: Record<string, string>;
  totals: { total: number; max: number; pct: number | null };
  bySubject: [string, { obtained: number; max: number }][];
}) {
  const [termFilter, setTermFilter] = useState("all");
  const terms = useMemo(() => [...new Set(marks.map((m) => m.exam_term))], [marks]);
  const filtered = termFilter === "all" ? marks : marks.filter((m) => m.exam_term === termFilter);

  const rows = useMemo(() => {
    const map = new Map<string, { obtained: number; max: number }>();
    for (const m of filtered) {
      const cur = map.get(m.subject_id) ?? { obtained: 0, max: 0 };
      cur.obtained += Number(m.marks_obtained);
      cur.max += Number(m.max_marks);
      map.set(m.subject_id, cur);
    }
    return [...map.entries()].map(([sid, v]) => ({
      name: subjectName[sid] ?? "Unknown",
      ...v,
      pct: v.max > 0 ? (v.obtained / v.max) * 100 : null,
    }));
  }, [filtered, subjectName]);

  const fTotal = rows.reduce((a, r) => a + r.obtained, 0);
  const fMax = rows.reduce((a, r) => a + r.max, 0);
  const fPct = fMax > 0 ? (fTotal / fMax) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 no-print">
        <select className={`${inputCls} sm:w-52`} value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
          <option value="all">All Exam Terms</option>
          {terms.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className={btnOutline} onClick={() => window.print()}>
          🖨️ Print Report Card
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom p-8 print:border-0">
        <div className="text-center border-b border-outline-variant/40 pb-6 mb-6">
          <h2 className="text-headline-lg text-primary">Report Card</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            {student.name} · Roll No {student.roll_number}
            {termFilter !== "all" ? ` · ${termFilter}` : ""}
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon="📄" title="Nothing to report yet" hint="Record some marks first." />
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant uppercase tracking-wider text-label-md text-on-surface-variant">
                  <th className="py-3 px-4 font-medium">Subject</th>
                  <th className="py-3 px-4 font-medium">Score</th>
                  <th className="py-3 px-4 font-medium">Percentage</th>
                  <th className="py-3 px-4 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{r.obtained} / {r.max}</td>
                    <td className="py-3 px-4 w-56"><Progress pct={r.pct} /></td>
                    <td className="py-3 px-4"><GradePill pct={r.pct} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline-variant bg-primary-fixed/20">
                  <td className="py-4 px-4 font-bold">Total</td>
                  <td className="py-4 px-4 font-bold">{fTotal} / {fMax}</td>
                  <td className="py-4 px-4 font-bold">{fPct === null ? "—" : `${Math.round(fPct)}%`}</td>
                  <td className="py-4 px-4"><GradePill pct={fPct} /></td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-label-md text-on-surface-variant">OVERALL RESULT</p>
                <p className="text-headline-md text-primary">
                  {fPct === null ? "—" : `${Math.round(fPct)}%`} ·{" "}
                  {fPct === null ? "" : fPct >= 40 ? "PASS" : "NEEDS IMPROVEMENT"}
                </p>
              </div>
              <p className="text-body-sm text-outline">Generated by EduAdmin · {new Date().toLocaleDateString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center bg-surface-container-high text-on-surface-variant text-label-md px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}
