"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { kwMatch, money } from "@/lib/utils";
import type { Opportunity } from "@/api/types";

export function RenewalsPage() {
  const { db, user, userById, studentById, touchOpp, runRenewalJob, canWriteStudent, daysUntil } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [type, setType] = React.useState("全部");
  const [status, setStatus] = React.useState("全部");
  const [adv, setAdv] = React.useState("全部");
  const [pending, setPending] = React.useState("未处理");
  const [edit, setEdit] = React.useState<Opportunity | null>(null);
  if (!user) return null;

  let rows = db.opportunities.slice();
  if (type !== "全部") rows = rows.filter((o) => o.type === type);
  if (status !== "全部") rows = rows.filter((o) => o.status === status);
  if (adv !== "全部") rows = rows.filter((o) => o.advisorId === adv);
  if (pending === "未处理") rows = rows.filter((o) => !o.handled && o.status !== "关闭");
  if (pending === "30 天未处理") rows = rows.filter((o) => !o.handled && daysUntil(o.openedAt) <= -30);
  rows = rows.filter((o) => kwMatch(o, kw, ["rec", "type"]) || (studentById(o.studentId)?.zhName || "").includes(kw));
  const advOptions = user.role === "advisor" ? db.users.filter((u) => u.id === user.id) : db.users.filter((u) => u.role === "advisor");

  return (
    <div data-screen-label="续费二销">
      <PageHead title="续费 / 二销" desc="T-90 自动建机会 + 手工机会。改状态 / 下次行动 / 跟进任一保存即已处理；30 天无操作催顾问，再无操作升级主管。" extra={
        user.role === "owner" ? <Button onClick={runRenewalJob}>模拟 T-90 跑批</Button> : null
      } />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setType("全部"); setStatus("全部"); setAdv("全部"); setPending("未处理"); }}>
        <Select value={pending} onChange={(e) => setPending(e.target.value)}><option>未处理</option><option>30 天未处理</option><option>全部</option></Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="全部">类型：全部</option><option>续费</option><option>二销</option></Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="全部">状态：全部</option><option>新机会</option><option>跟进</option><option>关闭</option></Select>
        <Select value={adv} onChange={(e) => setAdv(e.target.value)}><option value="全部">顾问：全部</option>{advOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
      </FilterBar>
      <DataTable rows={rows} onRow={(o) => setEdit(o)} empty="无未处理机会。老板可点「模拟 T-90 跑批」生成。" columns={[
        { key: "student", label: "学生", render: (o) => <b>{studentById(o.studentId)?.zhName}</b> },
        { key: "type", label: "类型", render: (o) => <StatusPill value={o.type} /> },
        { key: "rec", label: "推荐业务" },
        { key: "expireOn", label: "到期" },
        { key: "amount", label: "金额", render: (o) => o.amount ? money(o.amount, o.currency) : "—" },
        { key: "advisor", label: "顾问", render: (o) => userById(o.advisorId)?.name },
        { key: "opened", label: "建立 / 升级", render: (o) => <span className="inline-flex items-center gap-1">{o.openedAt}{o.escalated ? <Badge tone="red">已升级主管</Badge> : null}</span> },
        { key: "status", label: "状态", render: (o) => <StatusPill value={o.status} /> },
        { key: "handled", label: "已处理", render: (o) => o.handled ? "是" : <span className="text-warning">否</span> },
      ]} />
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="跟进机会">
        {edit ? (
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); touchOpp(edit.id, { status: String(f.get("status")) as Opportunity["status"], nextAction: String(f.get("nextAction")), followup: String(f.get("followup")) }); setEdit(null); }}>
            <p className="mb-3 text-sm">{studentById(edit.studentId)?.zhName} · {edit.rec} · 到期 {edit.expireOn}</p>
            {!canWriteStudent(studentById(edit.studentId)) ? <p className="mb-3 text-sm text-warning">同事的机会：只读。</p> : null}
            <Field label="状态"><Select name="status" defaultValue={edit.status} className="w-full"><option>新机会</option><option>跟进</option><option>关闭</option></Select></Field>
            <Field label="下次行动"><Input name="nextAction" defaultValue={edit.nextAction} /></Field>
            <Field label="跟进记录"><Textarea name="followup" defaultValue={edit.followup} /></Field>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={!canWriteStudent(studentById(edit.studentId))}>保存（记为已处理）</Button>
              <Button onClick={() => router.push("/students/" + edit.studentId)}>打开学生 360</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
