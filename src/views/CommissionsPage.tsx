"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Input, Select } from "@/components/ui/input";
import { StatusPill } from "@/components/status-pill";
import { money } from "@/lib/utils";
import type { Commission } from "@/api/types";

export function CommissionsPage() {
  const { db, user, userById, studentById, partnerById, visibleCommissions, isFinanceOrOwner, formula, updateCommission } = useCRM();
  const [kw, setKw] = React.useState("");
  const [filer, setFiler] = React.useState("全部");
  const [state, setState] = React.useState("全部");
  if (!user) return null;

  const payOf = (c: Commission) => db.payments.find((p) => p.id === c.paymentId);
  let rows = visibleCommissions.slice();
  if (filer !== "全部") rows = rows.filter((c) => c.filerType === filer);
  if (state === "待返") rows = rows.filter((c) => formula(c).wait > 0 && payOf(c)?.status === "已付款");
  if (state === "已核准") rows = rows.filter((c) => payOf(c)?.status === "已付款");
  rows = rows.filter((c) => { const p = payOf(c); const st = studentById(p?.studentId); return !kw || (st?.zhName || "").includes(kw) || (c.filerType === "顾问" ? userById(c.filerUserId)?.name : partnerById(c.filerPartnerId)?.name)?.includes(kw); });

  const NumCell = ({ c, k }: { c: Commission; k: "refund" | "rate" | "paidOut" }) => isFinanceOrOwner ? (
    <Input type="number" defaultValue={c[k]} className="w-20 border-primary bg-blue-50 py-1 text-primary" onBlur={(e) => { const v = Number(e.target.value); if (v !== c[k]) updateCommission(c.id, { [k]: v }); }} />
  ) : <>{c[k]}</>;

  return (
    <div data-screen-label="佣金">
      <PageHead title="佣金台账" desc={`谁填报谁拿。${isFinanceOrOwner ? "退款 / 比例 / 已返可改，自动列实时重算。" : "只看自己作为填报人的行，无同事和合作方行。"} 公式：净实收=实收−退款；应返=净×比例；待返=应返−已返；扣佣后=净−应返。`} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setFiler("全部"); setState("全部"); }}>
        {isFinanceOrOwner ? <Select value={filer} onChange={(e) => setFiler(e.target.value)}><option value="全部">填报人类型：全部</option><option>顾问</option><option>合作方</option></Select> : null}
        <Select value={state} onChange={(e) => setState(e.target.value)}><option value="全部">核准：全部</option><option>已核准</option><option>待返</option></Select>
      </FilterBar>
      <DataTable rows={rows} empty="没有可见的佣金行。" columns={[
        { key: "student", label: "学生", render: (c) => studentById(payOf(c)?.studentId)?.zhName },
        { key: "who", label: "填报人", render: (c) => <span><b>{c.filerType === "顾问" ? userById(c.filerUserId)?.name : partnerById(c.filerPartnerId)?.name}</b><span className="ml-1 text-xs text-muted">({c.filerType})</span></span> },
        { key: "paystat", label: "收费状态", render: (c) => <StatusPill value={payOf(c)?.status} /> },
        { key: "received", label: "实收", render: (c) => money(c.received, payOf(c)?.currency) },
        { key: "refund", label: "退款", render: (c) => <NumCell c={c} k="refund" /> },
        { key: "rate", label: "比例 %", render: (c) => <NumCell c={c} k="rate" /> },
        { key: "net", label: "净实收", render: (c) => money(formula(c).net) },
        { key: "due", label: "应返", render: (c) => money(formula(c).due) },
        { key: "paidOut", label: "已返", render: (c) => <NumCell c={c} k="paidOut" /> },
        { key: "wait", label: "待返", render: (c) => <b className={formula(c).wait > 0 ? "text-warning" : ""}>{money(formula(c).wait)}</b> },
        { key: "after", label: "扣佣后", render: (c) => money(formula(c).after) },
      ]} />
    </div>
  );
}
