"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteClass, deleteSubject, saveClass, saveSubject } from "@/app/actions";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { EmptyState, Field, GradePill, Modal, Spinner, btnOutline, btnPrimary, inputCls } from "@/components/ui";
import { computeStudentStats } from "@/lib/stats";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

const ICONS = ["calculate", "science", "biotech", "history_edu", "menu_book", "code", "language", "palette"];

export function DashboardClient({
  classes,
  students,
  marks,
  subjects,
  error,
}: {
  classes: ClassRow[];
  students: StudentRow[];
  marks: MarkRow[];
  subjects: SubjectRow[];
  error?: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; cls?: ClassRow }>({ open: false });
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [subjectBusy, setSubjectBusy] = useState(false);

  const stats = useMemo(() => {
    const byClass = new Map<string, { count: number; pct: number | null; total: number; max: number }>();
    for (const c of classes) byClass.set(c.id, { count: 0, pct: null, total: 0, max: 0 });
    const statMap = new Map(computeStudentStats(students, marks).map((s) => [s.student.id, s]));
    for (const st of students) {
      const entry = byClass.get(st.class_id);
      if (!entry) continue;
      entry.count++;
      const s = statMap.get(st.id);
      if (s && s.pct !== null) {
        entry.total += s.total;
        entry.max += s.totalMax;
      }
    }
    const out = new Map<string, { count: number; pct: number | null }>();
    for (const [id, e] of byClass) out.set(id, { count: e.count, pct: e.max > 0 ? (e.total / e.max) * 100 : null });
    return out;
  }, [classes, students, marks]);

  const overallAvg = useMemo(() => {
    const all = computeStudentStats(students, marks).filter((s) => s.pct !== null);
    if (all.length === 0) return null;
    return (all.reduce((a, s) => a + s.total, 0) / all.reduce((a, s) => a + s.totalMax, 0)) * 100;
  }, [students, marks]);

  const visible = classes.filter((c) =>
    `${c.name} ${c.section ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  function run(fn: () => Promise<{ error?: string }>, okMsg?: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast("error", res.error);
      else if (okMsg) toast("success", okMsg);
    });
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSubjectBusy(true);
    const res = await saveSubject({ name: newSubject });
    setSubjectBusy(false);
    if (res.error) toast("error", res.error);
    else {
      toast("success", `Subject "${newSubject.trim()}" added`);
      setNewSubject("");
    }
  }

  return (
    <>
      {/* Top bar */}
      <header className="h-16 px-6 bg-surface flex justify-between items-center sticky top-0 z-40 border-b border-outline-variant/30">
        <div>
          <h2 className="text-headline-sm font-bold">Dashboard</h2>
          <p className="text-body-sm text-on-surface-variant">
            {classes.length} class{classes.length === 1 ? "" : "es"} · {students.length} student
            {students.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto max-w-content mx-auto w-full">
        {error && (
          <p className="mb-6 text-body-md text-on-error-container bg-error-container rounded-lg px-4 py-3">{error}</p>
        )}

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Kpi label="Total Classes" value={String(classes.length)} />
          <Kpi label="Total Students" value={String(students.length)} />
          <Kpi label="Subjects" value={String(subjects.length)} />
          <Kpi
            label="Avg. Performance"
            value={overallAvg === null ? "—" : `${Math.round(overallAvg)}%`}
            accent
          />
        </section>

        {/* Classes */}
        <section id="classes" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-headline-sm font-bold">My Classes</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Search classes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className={btnPrimary} onClick={() => setModal({ open: true })}>
                <Icon name="add" /> New Class
              </button>
            </div>
          </div>

          {visible.length === 0 && !pending ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom">
              <EmptyState icon="🎓" title={classes.length === 0 ? "No classes yet" : "No matches"} hint={classes.length === 0 ? 'Create your first class with the "New Class" button.' : "Try a different search."} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((c, i) => {
                const s = stats.get(c.id);
                return (
                  <div key={c.id} className={`relative bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom hover:shadow-bloom-hover hover:-translate-y-0.5 transition-all flex flex-col gap-4 ${pending ? "opacity-70" : ""}`}>
                    <div className="flex justify-between items-start">
                      <Link href={`/classes/${c.id}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
                          <span className="material-symbols-outlined">{ICONS[i % ICONS.length]}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-body-lg group-hover:text-primary transition-colors">{c.name}</h4>
                          <p className="text-body-sm text-on-surface-variant">Section {c.section || "—"}</p>
                        </div>
                      </Link>
                      <button
                        aria-label="Class menu"
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                        onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                      {menuFor === c.id && (
                        <div className="absolute right-3 top-14 z-20 bg-surface-container-lowest border border-outline-variant/60 rounded-lg shadow-bloom-hover py-1 w-40">
                          <MenuItem icon="visibility" label="Open" onClick={() => (window.location.href = `/classes/${c.id}`)} />
                          <MenuItem icon="assessment" label="Report" onClick={() => (window.location.href = `/classes/${c.id}/report`)} />
                          <MenuItem icon="edit" label="Edit" onClick={() => { setModal({ open: true, cls: c }); setMenuFor(null); }} />
                          <MenuItem
                            icon="delete"
                            label="Delete"
                            danger
                            onClick={() => {
                              setMenuFor(null);
                              if (!confirm(`Delete "${c.name}" and all its students & marks?`)) return;
                              run(() => deleteClass(c.id), "Class deleted");
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-4 border-t border-outline-variant/30">
                      <div className="flex flex-col">
                        <span className="text-body-sm text-on-surface-variant">Students</span>
                        <span className="text-body-lg font-semibold">{s?.count ?? 0}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-body-sm text-on-surface-variant">Avg. Grade</span>
                        <GradePill pct={s?.pct ?? null} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {pending && (
                <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/50 shadow-bloom animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-dim" />
                    <div className="flex flex-col gap-2">
                      <div className="w-24 h-4 bg-surface-dim rounded" />
                      <div className="w-16 h-3 bg-surface-dim rounded" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Subjects */}
        <section className="mt-10">
          <h3 className="text-headline-sm font-bold mb-4">Subjects</h3>
          <form onSubmit={addSubject} className="flex gap-2 max-w-md">
            <input
              className={inputCls}
              placeholder="Add a subject (e.g. Mathematics)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button type="submit" disabled={subjectBusy} className={btnPrimary}>
              {subjectBusy ? <Spinner /> : <Icon name="add" />}
              Add
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4">
            {subjects.length === 0 && (
              <p className="text-body-md text-on-surface-variant">No subjects yet — add one above to start recording marks.</p>
            )}
            {subjects.map((sub) => (
              <span key={sub.id} className="inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed-variant text-label-md px-3 py-1.5 rounded-full">
                {sub.name}
                <button
                  aria-label={`Delete ${sub.name}`}
                  className="hover:text-error"
                  onClick={() => {
                    if (!confirm(`Delete subject "${sub.name}" and its marks?`)) return;
                    run(() => deleteSubject(sub.id), "Subject deleted");
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Add/Edit Class modal */}
      <ClassModal
        key={modal.cls?.id ?? "new"}
        open={modal.open}
        initial={modal.cls}
        onClose={() => setModal({ open: false })}
        onSubmit={(values) => {
          const isEdit = !!modal.cls;
          run(
            () => saveClass(values),
            isEdit ? "Class updated" : `Class "${values.name}" created`,
          );
          setModal({ open: false });
        }}
      />
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/50 shadow-bloom relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary-fixed/30 rounded-bl-full" />
      <span className="text-body-sm text-on-surface-variant font-medium">{label}</span>
      <div className={`text-headline-lg ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-body-md transition-colors ${
        danger ? "text-error hover:bg-error-container/30" : "text-on-surface hover:bg-surface-container-high"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

function ClassModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; section: string; id?: string }) => void;
  initial?: ClassRow;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [section, setSection] = useState(initial?.section ?? "");
  const [errors, setErrors] = useState<{ name?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Class name is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ id: initial?.id, name, section });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Class" : "Add New Class"}>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field label="Class Name" error={errors.name}>
          <input className={inputCls} placeholder="Mathematics 101" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Section">
          <input className={inputCls} placeholder="A" value={section} onChange={(e) => setSection(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className={btnOutline} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            {initial ? "Save Changes" : "Create Class"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
