"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PERIODS = [
  { key: "2026-09-14 ~ 2026-09-27", from: "2026-09-14", to: "2026-09-27" },
  { key: "2026-08-31 ~ 2026-09-13", from: "2026-08-31", to: "2026-09-13" },
];

export function SettlementsPage() {
  const { db, teacherById, studentById } = useCRM();
  const [kw, setKw] = React.useState("");
  const [period, setPeriod] = React.useState(PERIODS[0].key);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const p = PERIODS.find((x) => x.key === period)!;
  const approved = db.hours.filter((h) => h.status === "已通过" && h.date >= p.from && h.date <= p.to);

  const byT: Record<string, { id: string; hours: number; count: number; students: Set<string> }> = {};
  approved.forEach((h) => {
    byT[h.teacherId] ??= { id: h.teacherId, hours: 0, count: 0, students: new Set() };
    byT[h.teacherId].hours += h.planned;
    byT[h.teacherId].count += 1;
    byT[h.teacherId].students.add(h.studentId);
  });
  let rows = Object.values(byT).map((r) => ({ ...r, studentsN: r.students.size }));
  if (kw) rows = rows.filter((r) => (teacherById(r.id)?.zhName || "").includes(kw) || approved.some((h) => h.teacherId === r.id && (studentById(h.studentId)?.zhName || "").includes(kw)));

  return (
    <div data-screen-label="老师课时结算">
      <PageHead title="老师课时结算" desc="按双周汇总已通过拟计入，只出数字不算发薪；线下打款。与课时审核分页。" extra={<Button onClick={() => toast.success("已导出结算表（演示）")}>导出</Button>} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setPeriod(PERIODS[0].key); }}>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((x) => <option key={x.key}>{x.key}</option>)}</Select>
      </FilterBar>
      <DataTable rows={rows} onRow={(r) => setExpanded(expanded === r.id ? null : r.id)} empty="该周期暂无已通过课时。" columns={[
        { key: "teacher", label: "老师", render: (r) => <b>{teacherById(r.id)?.zhName}</b> },
        { key: "count", label: "条数" },
        { key: "studentsN", label: "学生数" },
        { key: "hours", label: "拟计入合计", render: (r) => <b>{r.hours}</b> },
      ]} />
      {expanded ? (
        <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-sm">
          <div className="mb-2 font-medium">{teacherById(expanded)?.zhName} · 明细</div>
          <ul className="divide-y divide-border">
            {approved.filter((h) => h.teacherId === expanded).map((h) => <li key={h.id} className="flex justify-between py-1.5"><span>{h.date} · {studentById(h.studentId)?.zhName} · {h.subject}</span><b>{h.planned}</b></li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
