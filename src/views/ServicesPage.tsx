"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select } from "@/components/ui/input";
import { StatusPill } from "@/components/status-pill";
import { TypeChip } from "@/components/type-chip";
import { kwMatch } from "@/lib/utils";

export function ServicesPage() {
  const { db, user, userById, studentById, teacherById, remain, daysUntil } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [status, setStatus] = React.useState("全部");
  const [type, setType] = React.useState("全部");
  const [adv, setAdv] = React.useState("全部");
  const [ending, setEnding] = React.useState("全部");
  const [low, setLow] = React.useState(false);
  if (!user) return null;

  let rows = db.services.slice();
  if (status !== "全部") rows = rows.filter((s) => s.status === status);
  if (type !== "全部") rows = rows.filter((s) => s.type === type);
  if (adv !== "全部") rows = rows.filter((s) => s.advisorId === adv);
  if (ending === "90 天内到期") rows = rows.filter((s) => daysUntil(s.end) <= 90);
  if (low) rows = rows.filter((s) => remain(s) <= 10);
  rows = rows.filter((s) => kwMatch(s, kw, ["name", "type"]) || (studentById(s.studentId)?.zhName || "").includes(kw));
  const advOptions = user.role === "advisor" ? db.users.filter((u) => u.id === user.id) : db.users.filter((u) => u.role === "advisor");

  return (
    <div data-screen-label="服务列表">
      <PageHead title="服务" desc="服务可不挂订单；老师只能选主数据。剩余课时 = 总课时 − 已通过拟计入。新建请进学生 360。" />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setStatus("全部"); setType("全部"); setAdv("全部"); setEnding("全部"); setLow(false); }}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="全部">状态：全部</option><option>进行中</option><option>已完成</option><option>暂停</option></Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="全部">类型：全部</option>{db.enums.dealTypes.map((t) => <option key={t}>{t}</option>)}</Select>
        <Select value={adv} onChange={(e) => setAdv(e.target.value)}><option value="全部">负责人：全部</option>{advOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select value={ending} onChange={(e) => setEnding(e.target.value)}><option value="全部">结束日：全部</option><option>90 天内到期</option></Select>
        <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> 剩余≤10</label>
      </FilterBar>
      <DataTable rows={rows} onRow={(s) => router.push("/students/" + s.studentId)} columns={[
        { key: "name", label: "服务", render: (s) => <b>{s.name}</b> },
        { key: "student", label: "学生", render: (s) => studentById(s.studentId)?.zhName },
        { key: "type", label: "类型", render: (s) => <TypeChip value={s.type} siblings={db.enums.dealTypes} /> },
        { key: "teacher", label: "老师", render: (s) => teacherById(s.teacherId)?.zhName || "—" },
        { key: "advisor", label: "顾问", render: (s) => userById(s.advisorId)?.name },
        { key: "start", label: "开始日期" },
        { key: "end", label: "结束日期" },
        { key: "remain", label: "剩余 / 总", render: (s) => <span className={remain(s) <= 10 ? "font-semibold text-warning" : ""}>{remain(s)} / {s.totalHours}</span> },
        { key: "deal", label: "订单", render: (s) => s.dealId ? db.deals.find((d) => d.id === s.dealId)?.name : "未挂" },
        { key: "status", label: "状态", render: (s) => <StatusPill value={s.status} /> },
      ]} />
    </div>
  );
}
