"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { CountChips } from "@/components/count-chips";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { kwMatch, money } from "@/lib/utils";
import { PAY_FLOW, type Currency, type Payment } from "@/api/types";

export function PaymentsPage() {
  const { db, user, userById, studentById, partnerById, visiblePayments, isFinanceOrOwner, advancePay, returnPay, confirmPayAmount, addPayment } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [chip, setChip] = React.useState("待处理");
  const [filer, setFiler] = React.useState("全部");
  const [ccy, setCcy] = React.useState("全部");
  const [ret, setRet] = React.useState<Payment | null>(null);
  const [edit, setEdit] = React.useState<Payment | null>(null);
  const [add, setAdd] = React.useState(false);
  if (!user) return null;

  const all = visiblePayments;
  const count = (s: string) => all.filter((p) => p.status === s).length;
  const chips = [
    { key: "待处理", count: count("已登记") + count("待确认") + count("未付款") },
    { key: "已登记", count: count("已登记") }, { key: "待确认", count: count("待确认") }, { key: "未付款", count: count("未付款") },
    { key: "已付款", count: count("已付款") }, { key: "退回", count: count("退回") }, { key: "全部", count: all.length },
  ];
  let rows = all.slice();
  if (chip === "待处理") rows = rows.filter((p) => ["已登记", "待确认", "未付款"].includes(p.status));
  else if (chip !== "全部") rows = rows.filter((p) => p.status === chip);
  if (filer !== "全部") rows = rows.filter((p) => p.filerType === filer);
  if (ccy !== "全部") rows = rows.filter((p) => p.currency === ccy);
  rows = rows.filter((p) => kwMatch(p, kw, ["voucher", "note"]) || (studentById(p.studentId)?.zhName || "").includes(kw));
  const mine = user.role === "owner" ? db.students : db.students.filter((s) => s.advisorId === user.id);

  return (
    <div data-screen-label="收费登记">
      <PageHead title="收费登记" desc={isFinanceOrOwner ? "财务队列：默认待处理 + 顶栏计数。行内推进 / 退回；待确认可改金额。" : "自己负责学生的收费单（含合作方代登）。状态由财务推进。"} extra={
        user.role !== "finance" ? <Button variant="primary" onClick={() => setAdd(true)}>登记收费</Button> : null
      } />
      <CountChips items={chips} active={chip} onChange={setChip} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setChip("待处理"); setFiler("全部"); setCcy("全部"); }}>
        <Select value={filer} onChange={(e) => setFiler(e.target.value)}><option value="全部">填报人：全部</option><option>顾问</option><option>合作方</option></Select>
        <Select value={ccy} onChange={(e) => setCcy(e.target.value)}><option value="全部">币种：全部</option><option>CNY</option><option>CAD</option></Select>
      </FilterBar>
      <DataTable rows={rows} onRow={user.role === "finance" ? undefined : (p) => router.push("/students/" + p.studentId)} empty="此状态下没有收费单。" columns={[
        { key: "student", label: "学生", render: (p) => <b>{studentById(p.studentId)?.zhName}</b> },
        { key: "deal", label: "订单", render: (p) => p.dealId ? db.deals.find((d) => d.id === p.dealId)?.name : "未挂" },
        { key: "amount", label: "金额", render: (p) => money(p.amount, p.currency) },
        { key: "voucher", label: "凭证", render: (p) => <span className="text-primary underline decoration-dotted">{p.voucher}</span> },
        { key: "filer", label: "填报人", render: (p) => <span>{p.filerType === "顾问" ? userById(p.filerUserId)?.name : partnerById(p.filerPartnerId)?.name}<span className="ml-1 text-xs text-muted">({p.filerType})</span></span> },
        { key: "createdAt", label: "提交日" },
        { key: "status", label: "状态", render: (p) => <span className="inline-flex items-center gap-1"><StatusPill value={p.status} />{p.status === "退回" && p.note ? <span className="text-xs text-muted">{p.note}</span> : null}</span> },
        { key: "act", label: "操作", render: (p) => !isFinanceOrOwner ? "—" : (
          <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {PAY_FLOW.includes(p.status) && p.status !== "已付款" ? <Button size="sm" variant="primary" onClick={() => advancePay(p.id)}>推进 → {PAY_FLOW[PAY_FLOW.indexOf(p.status) + 1]}</Button> : null}
            {p.status === "待确认" ? <Button size="sm" onClick={() => setEdit(p)}>改金额</Button> : null}
            {p.status === "已登记" || p.status === "待确认" ? <Button size="sm" variant="danger" onClick={() => setRet(p)}>退回</Button> : null}
          </span>
        ) },
      ]} />

      <Dialog open={!!ret} onClose={() => setRet(null)} title="退回收费">
        {ret ? (
          <form onSubmit={(e) => { e.preventDefault(); returnPay(ret.id, String(new FormData(e.currentTarget).get("reason"))); setRet(null); }}>
            <p className="mb-3 text-sm">{studentById(ret.studentId)?.zhName} · {money(ret.amount, ret.currency)}。退回作废不结佣；合作方 token 链接失效须重发。</p>
            <Field label="原因"><Textarea name="reason" required /></Field>
            <Button type="submit" variant="danger">退回</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title="待确认 · 改金额">
        {edit ? (
          <form onSubmit={(e) => { e.preventDefault(); confirmPayAmount(edit.id, Number(new FormData(e.currentTarget).get("amount"))); setEdit(null); }}>
            <Field label="金额" hint="改后佣金实收同步重算"><Input name="amount" type="number" defaultValue={edit.amount} /></Field>
            <Button type="submit" variant="primary">保存</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={add} onClose={() => setAdd(false)} title="登记收费">
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addPayment({ studentId: String(f.get("studentId")), amount: Number(f.get("amount")), currency: String(f.get("currency")) as Currency, dealId: String(f.get("dealId")) || undefined, voucher: String(f.get("voucher")) || "voucher.png", note: String(f.get("note")) }); setAdd(false); }}>
          <Field label="学生（自己负责）"><Select name="studentId" className="w-full">{mine.map((s) => <option key={s.id} value={s.id}>{s.zhName}</option>)}</Select></Field>
          <FormRow>
            <Field label="金额"><Input name="amount" type="number" required /></Field>
            <Field label="币种"><Select name="currency" className="w-full"><option>CNY</option><option>CAD</option></Select></Field>
          </FormRow>
          <Field label="订单（可空）"><Select name="dealId" className="w-full"><option value="">不挂订单</option>{db.deals.map((d) => <option key={d.id} value={d.id}>{studentById(d.studentId)?.zhName} · {d.name}</option>)}</Select></Field>
          <Field label="凭证 *"><Input name="voucher" placeholder="receipt.png" required /></Field>
          <Field label="备注"><Textarea name="note" /></Field>
          <Button type="submit" variant="primary">提交登记</Button>
        </form>
      </Dialog>
    </div>
  );
}
