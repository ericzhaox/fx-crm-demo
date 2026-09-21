"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { KV } from "@/components/panel";
import { kwMatch } from "@/lib/utils";
import { toast } from "sonner";
import type { Audit } from "@/api/types";

const TYPES = ["登录", "登出", "新增", "修改", "审核", "导入", "权限变更"];

export function AuditPage() {
  const { db, user, userById } = useCRM();
  const [kw, setKw] = React.useState("");
  const [type, setType] = React.useState("全部");
  const [actor, setActor] = React.useState("全部");
  const [result, setResult] = React.useState("全部");
  const [detail, setDetail] = React.useState<Audit | null>(null);
  if (!user) return null;

  let rows = db.audits.slice();
  if (user.role !== "owner") rows = rows.filter((a) => a.actorId === user.id);
  if (type !== "全部") rows = rows.filter((a) => a.type === type);
  if (actor !== "全部") rows = rows.filter((a) => a.actorId === actor);
  if (result !== "全部") rows = rows.filter((a) => a.result === result);
  rows = rows.filter((a) => kwMatch(a, kw, ["content", "type", "result"]));

  return (
    <div data-screen-label="操作日志">
      <PageHead title="操作日志" desc={`只读、无删除。记登录 / 增改 / 审核 / 导入 / 权限变更；公开表提交不记。${user.role === "owner" ? "老板全量。" : "只能看到自己的。"} 保留 24 个月。`} extra={<Button onClick={() => toast.success("已导出 xlsx（演示）")}>导出</Button>} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setType("全部"); setActor("全部"); setResult("全部"); }}>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="全部">类型：全部</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        {user.role === "owner" ? <Select value={actor} onChange={(e) => setActor(e.target.value)}><option value="全部">操作人：全部</option>{db.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select> : null}
        <Select value={result} onChange={(e) => setResult(e.target.value)}><option value="全部">结果：全部</option><option>成功</option><option>失败</option></Select>
      </FilterBar>
      <DataTable rows={rows} onRow={setDetail} columns={[
        { key: "at", label: "时间", render: (a) => <code className="text-xs">{a.at}</code> },
        { key: "actor", label: "操作人", render: (a) => userById(a.actorId)?.name || "—" },
        { key: "type", label: "类型" },
        { key: "content", label: "内容", className: "whitespace-normal" },
        { key: "result", label: "结果" },
      ]} />
      <Dialog open={!!detail} onClose={() => setDetail(null)} title="日志详情">
        {detail ? (
          <div>
            <KV k="时间" v={detail.at} />
            <KV k="操作人" v={userById(detail.actorId)?.name} />
            <KV k="类型" v={detail.type} />
            <KV k="内容" v={detail.content} />
            <KV k="结果" v={detail.result} />
            <p className="mt-3 text-xs text-muted">日志不可编辑、不可删除。</p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
