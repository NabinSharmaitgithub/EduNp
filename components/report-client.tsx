"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { Avatar, GradePill, Progress, btnOutline, inputCls } from "@/components/ui";
import { computeStudentStats, rankStudents, subjectMap as mapSubjects } from "@/lib/stats";
import type { ClassRow, MarkRow, StudentRow, SubjectRow } from "@/lib/types";

type SortKey = "rank" | "name" | "roll" | `sub:${string}` | "avg";

export function ReportClient({
  cls,
  students,
  allMarks,
  subjects,
  homeHref = '/admin',
}: {
  cls: ClassRow;
  students: StudentRow[];
  allMarks: MarkRow[];
  subjects: SubjectRow[];
  homeHref?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [termFilter, setTermFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("avg");
  const [sortAsc, setSortAsc] = useState(false);

  const sName = useMemo(() => mapSubjects(subjects), [subjects]);
  const terms = useMemo(
    () => [...new Set(allMarks.map((m) => m.exam_term))].sort(),
    [allMarks],
  );

  const ranked = useMemo(
    () => rankStudents(computeStudentStats(students, allMarks, termFilter === "all" ? null : termFilter)),
    [students, allMarks, termFilter],
  );

  const summary = useMemo(() => {
    const withMarks = ranked.filter((r) => r.pct !== null);
    const avg = withMarks.length
      ? (withMarks.reduce((a, r) => a + r.total, 0) / withMarks.reduce((a, r) => a + r.totalMax, 0)) * 100
      : null;
    return {
      avg,
      top: withMarks[0],
      needsAttention: withMarks.filter((r) => r.pct! < 40).length,
      noMarks: ranked.length - withMarks.length,
    };
  }, [ranked]);

  const visible = useMemo(() => {
    let rows = ranked.filter((r) =>
      `${r.student.name} ${r.student.roll_number}`.toLowerCase().includes(search.toLowerCase()),
    );
    const dir = sortAsc ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * a.student.name.localeCompare(b.student.name);
        case "roll":
          return dir * a.student.roll_number.localeCompare(b.student.roll_number, undefined, { numeric: true });
        case "avg":
          return dir * ((b.pct ?? -1) - (a.pct ?? -1));
        case "rank":
          return dir * ((a.rank || Infinity) - (b.rank || Infinity));
        default: {
          if (sortKey.startsWith("sub:")) {
            const sid = sortKey.slice(4);
            const pa = a.bySubject[sid] ? (a.bySubject[sid].obtained / a.bySubject[sid].max) * 100 : -1;
            const pb = b.bySubject[sid] ? (b.bySubject[sid].obtained / b.bySubject[sid].max) * 100 : -1;
            return dir * (pb - pa);
          }
          return 0;
        }
      }
    });
    return rows;
  }, [ranked, search, sortKey, sortAsc]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc);
    else {
      setSortKey(k);
      // sensible defaults: rank & names ascending, scores descending
      setSortAsc(k === "rank" || k === "name" || k === "roll");
    }
  }

  function exportCsv() {
    const header = ["Rank", "Roll No", "Student", ...subjects.map((s) => s.name), "Average %", "Grade"];
    const lines = visible.map((r) => [
      r.rank || "-",
      r.student.roll_number,
      `"${r.student.name.replace(/"/g, '""')}"`,
      ...subjects.map((s) =>
        r.bySubject[s.id] ? `${r.bySubject[s.id].obtained}/${r.bySubject[s.id].max}` : "",
      ),
      r.pct === null ? "" : Math.round(r.pct),
      r.pct === null ? "" : Math.round(r.pct),
    ]);
    const csv = [header.join(","), ...lines.map((l) => l.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cls.name}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", "Report exported successfully");
  }

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="py-3 px-4 font-medium">
      <button className="inline-flex items-center gap-1 hover:text-primary transition-colors" onClick={() => toggleSort(k)}>
        {children}
        <span className={`material-symbols-outlined text-[16px] ${sortKey === k ? "opacity-100" : "opacity-0"}`}>
          {sortAsc ? "arrow_upward" : "arrow_downward"}
        </span>
      </button>
    </th>
  );

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank);

  return (
    <>
      <header className="h-16 px-6 bg-surface flex items-center sticky top-0 z-40 border-b border-outline-variant/30">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <Link href={homeHref} className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href={`/classes/${cls.id}`} className="hover:text-primary">{cls.name}</Link>
          <span>/</span>
          <span className="text-on-surface font-medium">Class Report</span>
        </nav>
      </header>

      <div className="flex-1 p-6 max-w-content mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="text-headline-md">Class Report — {cls.name}</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Performance summary across students</p>
          </div>
          <div className="flex flex-wrap gap-3 no-print">
            <select aria-label="Filter by exam term" className={`${inputCls} w-44`} value={termFilter} onChange={(e) => setTermFilter(e.target.value)}>
              <option value="all">Exam Term: All Terms</option>
              {terms.map((t) => (
                <option key={t} value={t}>Exam Term: {t}</option>
              ))}
            </select>
            <button className={btnOutline} onClick={() => window.print()}>
              <Icon name="print" /> Print
            </button>
            <button className="inline-flex items-center gap-2 bg-primary text-on-primary font-medium py-2.5 px-4 rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm" onClick={exportCsv}>
              <Icon name="download" /> Export CSV
            </button>
            <button className={btnOutline} onClick={() => router.push(`/classes/${cls.id}`)}>
              <Icon name="group" /> Students
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Chip label="Class Average" value={summary.avg === null ? "—" : `${Math.round(summary.avg)}%`} />
          <Chip label="Top of Class" value={summary.top ? `${summary.top.student.name} (${Math.round(summary.top.pct!)}%)` : "—"} />
          <Chip label="Needs Attention (<40%)" value={String(summary.needsAttention)} warn={summary.needsAttention > 0} />
          {summary.noMarks > 0 && <Chip label="No marks yet" value={String(summary.noMarks)} />}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-bloom overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                <SortTh k="rank">Rank</SortTh>
                <SortTh k="name">Student</SortTh>
                <SortTh k="roll">Roll</SortTh>
                {subjects.map((s) => (
                  <SortTh key={s.id} k={`sub:${s.id}`}>{s.name.slice(0, 8)}</SortTh>
                ))}
                <SortTh k="avg">Average</SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4 + subjects.length} className="py-10 text-center text-on-surface-variant">
                    {students.length === 0
                      ? "No students in this class yet."
                      : "No students match your search."}
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr
                  key={r.student.id}
                  onClick={() => router.push(`/students/${r.student.id}`)}
                  className="hover:bg-primary-container/5 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-semibold">{medal(r.rank)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.student.name} size="sm" />
                      <span className="font-medium whitespace-nowrap">{r.student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">{r.student.roll_number}</td>
                  {subjects.map((s) => (
                    <td key={s.id} className="py-3 px-4 text-on-surface-variant text-body-sm">
                      {r.bySubject[s.id]
                        ? `${Math.round((r.bySubject[s.id].obtained / r.bySubject[s.id].max) * 100)}%`
                        : "—"}
                    </td>
                  ))}
                  <td className="py-3 px-4"><Progress pct={r.pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length > 0 && (
          <p className="mt-3 text-body-sm text-outline no-print">
            Click column headers to sort · click a row to open the student profile.
          </p>
        )}
      </div>
    </>
  );
}

function Chip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={`px-4 py-2.5 rounded-lg border text-label-md ${
        warn
          ? "bg-error-container/40 border-error/30 text-on-error-container"
          : "bg-surface-container-lowest border-outline-variant/50"
      }`}
    >
      <span className="text-on-surface-variant">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
