"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { TypeChip } from "@/components/type-chip";
import { OverflowLinks } from "@/components/overflow-links";
import { kwMatch, money } from "@/lib/utils";
import type { HourEntry, Service, Student } from "@/api/types";

export function StudentsPage() {
  const { db, user, userById, partnerById, clv, nextRenew, remain, daysUntil, addStudent } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [adv, setAdv] = React.useState("全部");
  const [partner, setPartner] = React.useState("全部");
  const [status, setStatus] = React.useState("全部");
  const [warn, setWarn] = React.useState("全部");
  const [open, setOpen] = React.useState(false);
  if (!user) return null;

  let rows = db.students.slice();
  if (adv !== "全部") rows = rows.filter((s) => s.advisorId === adv);
  if (partner !== "全部") rows = rows.filter((s) => s.partnerId === partner);
  if (status !== "全部") rows = rows.filter((s) => s.status === status);
  if (warn === "课时≤10") rows = rows.filter((s) => db.services.some((sv) => sv.studentId === s.id && sv.status === "进行中" && remain(sv) <= 10));
  if (warn === "签证/Offer将到期") rows = rows.filter((s) => daysUntil(s.visaExpires) <= 45 || daysUntil(s.offerExpires) <= 45);
  rows = rows.filter((s) => kwMatch(s, kw, ["zhName", "enName", "fxId", "mobile", "wechat", "school"]));

  const advisors = db.users.filter((u) => u.role === "advisor");
  const types = db.enums.dealTypes;

  function recency(sv: Service) {
    const latest = db.hours.filter((h: HourEntry) => h.serviceId === sv.id).map((h) => h.date).sort().at(-1);
    return latest || sv.start;
  }
  function byRecency(a: Service, b: Service) {
    const d = recency(b).localeCompare(recency(a));
    return d !== 0 ? d : b.id.localeCompare(a.id);
  }
  function closedDeals(studentId: string) {
    return db.deals
      .filter((d) => d.studentId === studentId && d.status === "成交")
      .slice()
      .sort((a, b) => (b.closedAt || "").localeCompare(a.closedAt || "") || b.id.localeCompare(a.id));
  }
  function activeServices(studentId: string) {
    return db.services.filter((sv) => sv.studentId === studentId && sv.status === "进行中").slice().sort(byRecency);
  }
  function latestServiceType(studentId: string) {
    const all = db.services.filter((sv) => sv.studentId === studentId).slice().sort(byRecency);
    return all[0]?.type;
  }

  return (
    <div data-screen-label="学生列表">
      <PageHead title="学生" desc="顾问可看全部学生；写操作仅限自己负责的。点行进 360。" extra={user.role !== "finance" ? <Button variant="primary" onClick={() => setOpen(true)}>新建档案</Button> : null} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setAdv("全部"); setPartner("全部"); setStatus("全部"); setWarn("全部"); }}>
        <Select value={adv} onChange={(e) => setAdv(e.target.value)} aria-label="负责人">
          <option value="全部">负责人：全部</option>
          {advisors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select value={partner} onChange={(e) => setPartner(e.target.value)} aria-label="合作方">
          <option value="全部">合作方：全部</option>
          {db.partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="状态">
          <option value="全部">状态：全部</option>
          {["Active", "暂停", "Alumni", "Lost"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={warn} onChange={(e) => setWarn(e.target.value)} aria-label="提醒">
          <option>全部</option><option>课时≤10</option><option>签证/Offer将到期</option>
        </Select>
      </FilterBar>
      <DataTable
        rows={rows}
        onRow={(s) => router.push("/students/" + s.id)}
        columns={[
          { key: "fxId", label: "学生编号" },
          { key: "zhName", label: "中文名", render: (s) => <b>{s.zhName}</b> },
          { key: "enName", label: "英文名" },
          { key: "grade", label: "年级" },
          { key: "school", label: "学校" },
          { key: "advisor", label: "负责人", render: (s) => <span className={s.advisorId === user.id ? "font-medium text-primary" : ""}>{userById(s.advisorId)?.name}</span> },
          { key: "partner", label: "合作方", render: (s) => partnerById(s.partnerId)?.name || "—" },
          { key: "status", label: "状态", render: (s) => <StatusPill value={s.status} /> },
          { key: "deals", label: "关联订单", render: (s) => <OverflowLinks siblings={types} items={closedDeals(s.id).map((d) => ({ id: d.id, name: d.name, type: d.type }))} /> },
          { key: "services", label: "服务项目", render: (s) => <OverflowLinks siblings={types} items={activeServices(s.id).map((sv) => ({ id: sv.id, name: sv.name, type: sv.type }))} /> },
          { key: "latestSvc", label: "最近服务", render: (s) => <TypeChip value={latestServiceType(s.id)} siblings={types} /> },
          { key: "clv", label: "CLV(已付款)", render: (s) => `${money(clv(s.id, "CNY"))} CNY / ${money(clv(s.id, "CAD"))} CAD` },
          { key: "renew", label: "下次续费", render: (s) => nextRenew(s.id) || "—" },
        ]}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="新建学生档案">
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const row: Partial<Student> = {
            zhName: String(fd.get("zhName")), enName: String(fd.get("enName")), grade: String(fd.get("grade")), school: String(fd.get("school")),
            parentName: String(fd.get("parentName")), mobile: String(fd.get("mobile")), email: String(fd.get("email")), wechat: String(fd.get("wechat")),
            advisorId: user.role === "owner" ? String(fd.get("advisorId")) : user.id, source: String(fd.get("source")), partnerId: String(fd.get("partnerId")) || undefined,
            offerExpires: String(fd.get("offerExpires")) || undefined, visaExpires: String(fd.get("visaExpires")) || undefined,
          };
          addStudent(row);
          setOpen(false);
        }}>
          <FormRow>
            <Field label="中文名 *"><Input name="zhName" required /></Field>
            <Field label="英文名 *"><Input name="enName" required /></Field>
            <Field label="年级 *"><Input name="grade" required /></Field>
            <Field label="学校"><Input name="school" /></Field>
            <Field label="家长"><Input name="parentName" /></Field>
            <Field label="手机 *"><Input name="mobile" required /></Field>
            <Field label="邮箱"><Input name="email" type="email" /></Field>
            <Field label="微信"><Input name="wechat" /></Field>
            {user.role === "owner" ? <Field label="负责人"><Select name="advisorId" className="w-full">{advisors.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field> : null}
            <Field label="来源"><Input name="source" defaultValue="手工建档" /></Field>
            <Field label="合作方"><Select name="partnerId" className="w-full"><option value="">无</option>{db.partners.filter((p) => p.status === "active").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Offer 到期"><Input name="offerExpires" type="date" /></Field>
            <Field label="签证到期"><Input name="visaExpires" type="date" /></Field>
          </FormRow>
          <p className="mb-3 text-xs text-muted">CLV 不可手填，只按已付款收费自动计算。附件（合同/证件/Offer）走 OSS，演示不上传。</p>
          <Button type="submit" variant="primary">保存档案</Button>
        </form>
      </Dialog>
    </div>
  );
}
