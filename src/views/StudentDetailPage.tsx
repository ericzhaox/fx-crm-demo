"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { DataTable, EmptyState } from "@/components/data-table";
import { Tabs } from "@/components/ui/tabs";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/field";
import { HourLessonFields, readHourLesson, validateHourLesson } from "@/components/hour-lesson-fields";
import { StatusPill } from "@/components/status-pill";
import { TypeChip, TypeSelect } from "@/components/type-chip";
import { KV, Panel } from "@/components/panel";
import { money, withBase } from "@/lib/utils";
import { ATTENDANCE, DEAL_STAGES, type Currency } from "@/api/types";
import { toast } from "sonner";

const TABS = ["档案", "订单", "服务", "任务", "续费/二销", "收费"];
type Form = null | "deal" | "svc" | "task" | "opp" | "pay" | "hour";

export function StudentDetailPage({ id }: { id: string }) {
  const crm = useCRM();
  const { db, user, userById, teacherById, partnerById, clv, nextRenew, remain, canWriteStudent, setDealStatus } = crm;
  const router = useRouter();
  const [tab, setTab] = React.useState("档案");
  const [form, setForm] = React.useState<Form>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const student = db.students.find((s) => s.id === id);
  if (!user) return null;
  if (!student) return <EmptyState>找不到该学生。<div className="mt-3"><Button onClick={() => router.push("/students")}>返回列表</Button></div></EmptyState>;

  const can = canWriteStudent(student);
  const deals = db.deals.filter((d) => d.studentId === id);
  const svcs = db.services.filter((s) => s.studentId === id);
  const tasks = db.tasks.filter((t) => t.studentId === id);
  const opps = db.opportunities.filter((o) => o.studentId === id);
  const pays = db.payments.filter((p) => p.studentId === id);
  const activeTeachers = db.teachers.filter((t) => t.status === "active");

  const fd = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); return new FormData(e.currentTarget); };
  const str = (f: FormData, k: string) => String(f.get(k) ?? "");
  const num = (f: FormData, k: string) => Number(f.get(k) ?? 0);

  return (
    <div data-screen-label="学生360">
      <PageHead
        title={`${student.zhName} / ${student.enName}`}
        desc={`${student.fxId} · 负责人 ${userById(student.advisorId)?.name} · ${student.grade} · ${student.school}`}
        extra={
          <>
            <Button onClick={() => router.push("/students")}>返回列表</Button>
            {can ? <Button variant="primary" onClick={() => setToken(crm.issueToken(id))}>发缴费链接</Button> : null}
          </>
        }
      />
      {!can ? <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-warning">同事负责的学生：全部只读，写按钮已隐藏。</div> : null}
      {token ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <span>缴费链接：</span><code className="rounded bg-white px-1.5 py-0.5">{withBase("/p/pay/" + token)}</code>
          <Button size="sm" onClick={() => window.open(withBase("/p/pay/" + token), "_blank")}>新窗口打开</Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Panel title="概览">
          <KV k="CLV（仅已付款）" v={`${money(clv(id, "CNY"))} CNY · ${money(clv(id, "CAD"))} CAD`} />
          <KV k="下次续费" v={nextRenew(id)} />
          <KV k="状态" v={<StatusPill value={student.status} />} />
          <KV k="来源 / 合作方" v={`${student.source}${student.partnerId ? " · " + partnerById(student.partnerId)?.name : ""}`} />
          <KV k="首次成交" v={student.firstDealDate} />
          <KV k="签证到期" v={student.visaExpires} />
          <KV k="Offer 到期" v={student.offerExpires} />
          <KV k="进行中服务" v={svcs.filter((s) => s.status === "进行中").length} />
        </Panel>

        <div className="min-w-0">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === "档案" && (
            <Panel>
              <form onSubmit={(e) => {
                const f = fd(e);
                crm.updateStudent(id, {
                  zhName: str(f, "zhName"), enName: str(f, "enName"), grade: str(f, "grade"), school: str(f, "school"), parentName: str(f, "parentName"),
                  mobile: str(f, "mobile"), wechat: str(f, "wechat"), email: str(f, "email"), visaExpires: str(f, "visaExpires"), offerExpires: str(f, "offerExpires"),
                  status: str(f, "status") as typeof student.status,
                });
              }}>
                <FormRow>
                  <Field label="中文名"><Input name="zhName" defaultValue={student.zhName} disabled={!can} /></Field>
                  <Field label="英文名"><Input name="enName" defaultValue={student.enName} disabled={!can} /></Field>
                  <Field label="年级"><Input name="grade" defaultValue={student.grade} disabled={!can} /></Field>
                  <Field label="学校"><Input name="school" defaultValue={student.school} disabled={!can} /></Field>
                  <Field label="家长"><Input name="parentName" defaultValue={student.parentName} disabled={!can} /></Field>
                  <Field label="手机"><Input name="mobile" defaultValue={student.mobile} disabled={!can} /></Field>
                  <Field label="微信"><Input name="wechat" defaultValue={student.wechat} disabled={!can} /></Field>
                  <Field label="邮箱"><Input name="email" defaultValue={student.email} disabled={!can} /></Field>
                  <Field label="签证到期"><Input name="visaExpires" type="date" defaultValue={student.visaExpires} disabled={!can} /></Field>
                  <Field label="Offer 到期"><Input name="offerExpires" type="date" defaultValue={student.offerExpires} disabled={!can} /></Field>
                  <Field label="状态"><TypeSelect name="status" aria-label="状态" options={["Active", "暂停", "Alumni", "Lost"]} defaultValue={student.status} disabled={!can} /></Field>
                  <Field label="附件（OSS）"><div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted">合同.pdf · 护照.jpg（演示占位）</div></Field>
                </FormRow>
                {can ? <Button type="submit" variant="primary">保存档案</Button> : null}
              </form>
            </Panel>
          )}

          {tab === "订单" && (
            <>
              {can ? <Button variant="primary" className="mb-3" onClick={() => setForm("deal")}>新建订单</Button> : null}
              <DataTable rows={deals} empty="暂无订单。成交可以不挂服务。" columns={[
                { key: "name", label: "订单" }, { key: "type", label: "类型", render: (d) => <TypeChip value={d.type} siblings={db.enums.dealTypes} /> },
                { key: "amount", label: "金额", render: (d) => money(d.amount, d.currency) },
                { key: "partner", label: "合作方", render: (d) => partnerById(d.partnerId)?.name || "—" },
                { key: "services", label: "服务数", render: (d) => db.services.filter((s) => s.dealId === d.id).length },
                { key: "status", label: "状态", render: (d) => can ? (
                  <TypeSelect aria-label="状态" options={[...DEAL_STAGES]} value={d.status} onChange={(v) => setDealStatus(d.id, v as typeof d.status)} />
                ) : <StatusPill value={d.status} /> },
              ]} />
            </>
          )}

          {tab === "服务" && (
            <>
              {can ? <Button variant="primary" className="mb-3" onClick={() => setForm("svc")}>新建服务</Button> : null}
              <DataTable rows={svcs} empty="暂无服务。" columns={[
                { key: "name", label: "服务" }, { key: "type", label: "类型", render: (s) => <TypeChip value={s.type} siblings={db.enums.dealTypes} /> },
                { key: "teacher", label: "老师", render: (s) => teacherById(s.teacherId)?.zhName || "—" },
                { key: "range", label: "起止", render: (s) => `${s.start} ~ ${s.end}` },
                { key: "remain", label: "剩余 / 总课时", render: (s) => <span className={remain(s) <= 10 ? "font-semibold text-warning" : ""}>{remain(s)} / {s.totalHours}</span> },
                { key: "status", label: "状态", render: (s) => <StatusPill value={s.status} /> },
              ]} />
            </>
          )}

          {tab === "任务" && (
            <>
              {can ? <Button variant="primary" className="mb-3" onClick={() => setForm("task")}>新建任务</Button> : null}
              <DataTable rows={tasks} empty="暂无任务。" columns={[
                { key: "title", label: "任务" }, { key: "type", label: "类型", render: (t) => <TypeChip value={t.type} siblings={db.enums.taskTypes} /> }, { key: "deadline", label: "截止" },
                { key: "assignee", label: "负责人", render: (t) => userById(t.assigneeId)?.name },
                { key: "priority", label: "优先级", render: (t) => <StatusPill value={t.priority} /> },
                { key: "status", label: "状态", render: (t) => <StatusPill value={t.status} /> },
              ]} />
            </>
          )}

          {tab === "续费/二销" && (
            <>
              {can ? <Button variant="primary" className="mb-3" onClick={() => setForm("opp")}>手工建机会</Button> : null}
              <DataTable rows={opps} empty="暂无机会。T-90 到期前会自动建。" columns={[
                { key: "type", label: "类型", render: (o) => <StatusPill value={o.type} /> }, { key: "rec", label: "建议" }, { key: "expireOn", label: "到期" },
                { key: "amount", label: "金额", render: (o) => money(o.amount, o.currency) },
                { key: "status", label: "状态", render: (o) => <StatusPill value={o.status} /> },
                { key: "handled", label: "已处理", render: (o) => o.handled ? "是" : "否" },
              ]} />
            </>
          )}

          {tab === "收费" && (
            <>
              {can ? <Button variant="primary" className="mb-3" onClick={() => setForm("pay")}>登记收费</Button> : null}
              <DataTable rows={pays} empty="暂无收费。" columns={[
                { key: "amount", label: "金额", render: (p) => money(p.amount, p.currency) },
                { key: "filer", label: "填报人", render: (p) => p.filerType === "顾问" ? userById(p.filerUserId)?.name : partnerById(p.filerPartnerId)?.name },
                { key: "voucher", label: "凭证" }, { key: "createdAt", label: "登记日" },
                { key: "status", label: "状态", render: (p) => <StatusPill value={p.status} /> },
              ]} />
            </>
          )}
        </div>
      </div>

      <Dialog open={form === "deal"} onClose={() => setForm(null)} title="新建订单">
        <form onSubmit={(e) => { const f = fd(e); crm.addDeal({ studentId: id, name: str(f, "name"), type: str(f, "type"), amount: num(f, "amount"), currency: str(f, "currency") as Currency, partnerId: str(f, "partnerId") || undefined }); setForm(null); }}>
          <Field label="名称"><Input name="name" required /></Field>
          <FormRow>
            <Field label="类型"><TypeSelect name="type" aria-label="类型" options={db.enums.dealTypes} /></Field>
            <Field label="合作方"><Select name="partnerId" className="w-full"><option value="">无</option>{db.partners.filter((p) => p.status === "active").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="金额"><Input name="amount" type="number" required /></Field>
            <Field label="币种"><Select name="currency" className="w-full"><option>CNY</option><option>CAD</option></Select></Field>
          </FormRow>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>

      <Dialog open={form === "svc"} onClose={() => setForm(null)} title="新建服务">
        <form onSubmit={(e) => { const f = fd(e); crm.addService({ studentId: id, name: str(f, "name"), type: str(f, "type"), start: str(f, "start"), end: str(f, "end"), totalHours: num(f, "totalHours"), teacherId: str(f, "teacherId"), dealId: str(f, "dealId") || undefined }); setForm(null); }}>
          <Field label="名称"><Input name="name" required /></Field>
          <FormRow>
            <Field label="类型"><TypeSelect name="type" aria-label="类型" options={db.enums.dealTypes} /></Field>
            <Field label="老师（主数据）"><Select name="teacherId" className="w-full" required>{activeTeachers.map((t) => <option key={t.id} value={t.id}>{t.zhName}</option>)}</Select></Field>
            <Field label="开始"><Input name="start" type="date" required /></Field>
            <Field label="结束"><Input name="end" type="date" required /></Field>
            <Field label="总课时"><Input name="totalHours" type="number" required /></Field>
            <Field label="关联订单（可空）"><Select name="dealId" className="w-full"><option value="">不挂订单</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          </FormRow>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>

      <Dialog open={form === "task"} onClose={() => setForm(null)} title="新建任务">
        <form onSubmit={(e) => { const f = fd(e); crm.addTask({ studentId: id, title: str(f, "title"), deadline: str(f, "deadline"), type: str(f, "type"), priority: str(f, "priority") as "高" | "中" | "低", note: str(f, "note") }); setForm(null); }}>
          <Field label="事项"><Input name="title" required /></Field>
          <FormRow>
            <Field label="截止"><Input name="deadline" type="date" required /></Field>
            <Field label="优先级"><TypeSelect name="priority" aria-label="优先级" options={["高", "中", "低"]} defaultValue="中" /></Field>
            <Field label="类型"><TypeSelect name="type" aria-label="任务类型" options={db.enums.taskTypes} /></Field>
          </FormRow>
          <Field label="说明"><Textarea name="note" /></Field>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>

      <Dialog open={form === "opp"} onClose={() => setForm(null)} title="手工建机会">
        <form onSubmit={(e) => { const f = fd(e); crm.addOpportunity({ studentId: id, type: str(f, "type") as "续费" | "二销", rec: str(f, "rec"), expireOn: str(f, "expireOn"), amount: num(f, "amount"), currency: str(f, "currency") as Currency, serviceId: str(f, "serviceId") || undefined }); setForm(null); }}>
          <FormRow>
            <Field label="类型"><TypeSelect name="type" aria-label="机会类型" options={["续费", "二销"]} /></Field>
            <Field label="原服务（可空）"><Select name="serviceId" className="w-full"><option value="">无</option>{svcs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="到期"><Input name="expireOn" type="date" required /></Field>
            <Field label="金额"><Input name="amount" type="number" /></Field>
            <Field label="币种"><Select name="currency" className="w-full"><option>CAD</option><option>CNY</option></Select></Field>
          </FormRow>
          <Field label="推荐业务"><Input name="rec" required /></Field>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>

      <Dialog open={form === "pay"} onClose={() => setForm(null)} title="登记收费">
        <form onSubmit={(e) => { const f = fd(e); crm.addPayment({ studentId: id, amount: num(f, "amount"), currency: str(f, "currency") as Currency, dealId: str(f, "dealId") || undefined, voucher: str(f, "voucher") || "voucher.png", note: str(f, "note") }); setForm(null); }}>
          <FormRow>
            <Field label="金额"><Input name="amount" type="number" required /></Field>
            <Field label="币种"><Select name="currency" className="w-full"><option>CNY</option><option>CAD</option></Select></Field>
          </FormRow>
          <Field label="订单（可空）"><Select name="dealId" className="w-full"><option value="">不挂订单</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
          <Field label="凭证 *" hint="演示只记文件名；正式版签名上传 OSS"><Input name="voucher" placeholder="receipt.png" required /></Field>
          <Field label="备注"><Textarea name="note" /></Field>
          <p className="mb-3 text-xs text-muted">填报人 = 你本人，佣金行自动生成。状态从「已登记」起，由财务推进。</p>
          <Button type="submit" variant="primary">提交登记</Button>
        </form>
      </Dialog>

      <Dialog open={form === "hour"} onClose={() => setForm(null)} title="顾问代填课时">
        <form onSubmit={(e) => {
          const f = fd(e);
          const lesson = readHourLesson(f);
          const msg = validateHourLesson(lesson);
          if (msg) { toast.error(msg); return; }
          crm.addHourAdvisor({ studentId: id, title: str(f, "title"), serviceId: str(f, "serviceId") || undefined, teacherId: str(f, "teacherId"), subject: str(f, "subject"), attendance: str(f, "attendance") as (typeof ATTENDANCE)[number], date: str(f, "date"), start: str(f, "start"), hours: num(f, "hours"), ...lesson });
          setForm(null);
        }}>
          <Field label="标题 *"><Input name="title" required /></Field>
          <FormRow>
            <Field label="服务（可空）"><Select name="serviceId" className="w-full"><option value="">无</option>{svcs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="老师 *"><Select name="teacherId" className="w-full" required>{activeTeachers.map((t) => <option key={t.id} value={t.id}>{t.zhName}</option>)}</Select></Field>
            <Field label="科目 *"><Input name="subject" required /></Field>
            <Field label="出勤 *"><TypeSelect name="attendance" aria-label="出勤" options={[...ATTENDANCE]} /></Field>
            <Field label="日期 *"><Input name="date" type="date" required /></Field>
            <Field label="开始 *"><Input name="start" type="time" required /></Field>
            <Field label="本次课时（小时） *"><Input name="hours" type="number" step="0.5" required /></Field>
          </FormRow>
          <HourLessonFields />
          <Button type="submit" variant="primary">提交（待老板审）</Button>
        </form>
      </Dialog>
    </div>
  );
}
