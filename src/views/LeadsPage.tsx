"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { TypeChip } from "@/components/type-chip";
import { Badge } from "@/components/ui/badge";
import { kwMatch } from "@/lib/utils";
import type { Lead } from "@/api/types";

export function LeadsPage() {
  const { db, user, userById, claimLead, assignLead } = useCRM();
  const [kw, setKw] = React.useState("");
  const [follow, setFollow] = React.useState("全部");
  const [assign, setAssign] = React.useState<Lead | null>(null);
  if (!user) return null;

  let rows = db.leads.slice();
  if (follow === "未领取") rows = rows.filter((l) => !l.followerId);
  else if (follow !== "全部") rows = rows.filter((l) => l.followerId === follow);
  rows = rows.filter((l) => kwMatch(l, kw, ["zhName", "enName", "partnerName", "intent", "phone", "contact", "email", "parent", "parentPhone"]));

  return (
    <div data-screen-label="合作方线索">
      <PageHead title="合作方线索" desc="公开表提交进线索池；领取或指派时才建学生档案。本页无金额、无凭证。" />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setFollow("全部"); }}>
        <Select value={follow} onChange={(e) => setFollow(e.target.value)}>
          <option value="全部">跟进人：全部</option><option value="未领取">未领取</option>
          {db.users.filter((u) => u.role === "advisor").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
      </FilterBar>
      <DataTable rows={rows} columns={[
        { key: "zhName", label: "学生中文名", render: (l) => <span className="inline-flex items-center gap-2"><b>{l.zhName}</b>{!l.followerId ? <Badge tone="amber">未领取</Badge> : null}</span> },
        { key: "enName", label: "学生英文名", render: (l) => l.enName || "—" },
        { key: "partnerName", label: "合作方名称", render: (l) => <span>{l.partnerName}{!l.partnerId ? <span className="ml-1 text-xs text-muted">(手填，完成后入主数据)</span> : null}</span> },
        { key: "intent", label: "意向", render: (l) => <TypeChip value={l.intent} siblings={db.enums.dealTypes} /> },
        { key: "startOn", label: "预计开始日期", render: (l) => l.startOn || "—" },
        { key: "contact", label: "合作方联系人", render: (l) => l.contact || "—" },
        { key: "phone", label: "合作方电话", render: (l) => l.phone || "—" },
        { key: "email", label: "合作方邮箱", render: (l) => l.email || "—" },
        { key: "grade", label: "学生年级", render: (l) => l.grade || "—" },
        { key: "parent", label: "家长姓名", render: (l) => l.parent || "—" },
        { key: "parentPhone", label: "家长电话", render: (l) => l.parentPhone || "—" },
        { key: "note", label: "补充说明", render: (l) => l.note || "—" },
        { key: "follower", label: "跟进人", render: (l) => l.followerId ? userById(l.followerId)?.name : "—" },
        { key: "status", label: "审核状态", render: (l) => l.status ? <StatusPill value={l.status} /> : "—" },
        { key: "act", label: "操作", render: (l) => l.followerId ? "—" : user.role === "owner"
          ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setAssign(l); }}>指派</Button>
          : <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); claimLead(l.id); }}>领取</Button> },
      ]} />
      <Dialog open={!!assign} onClose={() => setAssign(null)} title="指派线索">
        {assign ? (
          <form onSubmit={(e) => { e.preventDefault(); assignLead(assign.id, String(new FormData(e.currentTarget).get("advisorId"))); setAssign(null); }}>
            <p className="mb-3 text-sm">{assign.zhName} · {assign.partnerName}</p>
            <Field label="指派给顾问"><Select name="advisorId" className="w-full">{db.users.filter((u) => u.role === "advisor" && u.status === "active").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
            <Button type="submit" variant="primary">指派并建档</Button>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
