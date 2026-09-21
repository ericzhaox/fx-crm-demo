"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FormRow } from "@/components/field";
import { EmptyState } from "@/components/data-table";
import { HourLessonFields, readHourLesson, validateHourLesson } from "@/components/hour-lesson-fields";
import { ATTENDANCE, type Currency, type HourEntry } from "@/api/types";

function Head({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}

const s = (f: FormData, k: string) => String(f.get(k) ?? "");

export function TeacherForm() {
  const { db, publicHour } = useCRM();
  const [err, setErr] = React.useState("");
  const [tick, setTick] = React.useState(0);
  const teachers = db.teachers.filter((t) => t.status === "active");
  return (
    <div data-screen-label="老师课时表">
      <Head title="老师课时填报" desc="提交后留在本页，可继续填下一节。已提交不改剩余课时，由顾问审核后计入。" />
      {!teachers.length ? <EmptyState>暂无生效老师，请联系顾问维护主数据。</EmptyState> : (
        <form onSubmit={(e) => {
          e.preventDefault(); setErr("");
          const f = new FormData(e.currentTarget);
          const lesson = readHourLesson(f);
          const msg = validateHourLesson(lesson);
          if (msg) { setErr(msg); return; }
          publicHour({
            title: s(f, "title"),
            teacherId: s(f, "teacherId"),
            studentId: s(f, "studentId"),
            serviceId: s(f, "serviceId") || undefined,
            subject: s(f, "subject"),
            attendance: s(f, "attendance") as HourEntry["attendance"],
            date: s(f, "date"),
            start: s(f, "start"),
            hours: Number(f.get("hours")),
            ...lesson,
          });
          e.currentTarget.reset();
          setTick((n) => n + 1);
        }}>
          <FormRow>
            <Field label="老师 *"><Select name="teacherId" className="w-full" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.zhName} / {t.enName}</option>)}</Select></Field>
            <Field label="学生 *"><Select name="studentId" className="w-full" required>{db.students.map((st) => <option key={st.id} value={st.id}>{st.zhName} / {st.enName}</option>)}</Select></Field>
          </FormRow>
          <Field label="关联服务（可空）"><Select name="serviceId" className="w-full"><option value="">不选</option>{db.services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}</option>)}</Select></Field>
          <FormRow>
            <Field label="科目（手填） *"><Input name="subject" placeholder="例如 数学" required /></Field>
            <Field label="标题 *"><Input name="title" required /></Field>
          </FormRow>
          {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
          <FormRow>
            <Field label="出勤 *"><Select name="attendance" className="w-full" required>{ATTENDANCE.map((a) => <option key={a}>{a}</option>)}</Select></Field>
            <Field label="本次课时（小时） *"><Input name="hours" type="number" step="0.5" min="0" required /></Field>
            <Field label="日期 *"><Input name="date" type="date" required /></Field>
            <Field label="开始时间 *"><Input name="start" type="time" required /></Field>
          </FormRow>
          <HourLessonFields key={tick} />
          <Button type="submit" variant="primary" className="w-full sm:w-auto">提交课时</Button>
        </form>
      )}
    </div>
  );
}

export function PartnerForm() {
  const { hydrated } = useCRM();
  if (!hydrated) return null;
  return <PartnerFormReady />;
}

function PartnerFormReady() {
  const { db, publicLead } = useCRM();
  const active = db.partners.filter((p) => p.status === "active");
  const first = active[0];
  const [pid, setPid] = React.useState(first?.id || "__new");
  const [partnerName, setPartnerName] = React.useState(first?.name || "");
  const [contact, setContact] = React.useState(first?.contact || "");
  const [phone, setPhone] = React.useState(first?.phone || "");
  const [email, setEmail] = React.useState(first?.email || "");
  const [err, setErr] = React.useState("");
  const isNew = pid === "__new";

  function applyPartner(id: string) {
    setPid(id);
    if (id === "__new") {
      setPartnerName("");
      setContact("");
      setPhone("");
      setEmail("");
      return;
    }
    const p = active.find((x) => x.id === id);
    setPartnerName(p?.name || "");
    setContact(p?.contact || "");
    setPhone(p?.phone || "");
    setEmail(p?.email || "");
  }

  return (
    <div data-screen-label="合作方线索表">
      <Head title="合作方新学生线索" desc="无金额、无凭证。提交后进入线索池，顾问领取后建档。可继续填下一位。" />
      <form onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        const f = new FormData(e.currentTarget);
        const name = partnerName.trim();
        const c = contact.trim();
        const ph = phone.trim();
        const zh = s(f, "zhName").trim();
        const parentPhone = s(f, "parentPhone").trim();
        if (!name || !c || !ph || !zh || !parentPhone) {
          setErr("合作方名称、合作方联系人、合作方电话、学生中文名、家长电话为必填");
          return;
        }
        publicLead({
          zhName: zh,
          enName: s(f, "enName"),
          startOn: s(f, "startOn"),
          partnerName: name,
          partnerId: isNew ? undefined : pid,
          contact: c,
          phone: ph,
          email: email.trim(),
          grade: s(f, "grade"),
          school: s(f, "school"),
          parent: s(f, "parent"),
          parentPhone,
          wechat: s(f, "wechat"),
          intent: s(f, "intent"),
          note: s(f, "note"),
        });
        e.currentTarget.reset();
        applyPartner(isNew ? (first?.id || "__new") : pid);
      }}>
        <Field label="合作方身份">
          <Select name="partnerId" className="w-full" value={pid} onChange={(e) => applyPartner(e.target.value)}>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__new">我是新合作方（手填名称）</option>
          </Select>
        </Field>
        <FormRow>
          <Field label="合作方名称 *"><Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required readOnly={!isNew} /></Field>
          <Field label="合作方联系人 *"><Input value={contact} onChange={(e) => setContact(e.target.value)} required /></Field>
          <Field label="合作方电话 *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
          <Field label="合作方邮箱"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="学生中文名 *"><Input name="zhName" required /></Field>
          <Field label="学生英文名"><Input name="enName" /></Field>
          <Field label="预计开始日期"><Input name="startOn" type="date" /></Field>
          <Field label="学生年级"><Input name="grade" /></Field>
          <Field label="学校"><Input name="school" /></Field>
          <Field label="家长姓名"><Input name="parent" /></Field>
          <Field label="家长电话 *"><Input name="parentPhone" required /></Field>
          <Field label="微信"><Input name="wechat" /></Field>
        </FormRow>
        {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
        <Field label="意向业务"><Select name="intent" className="w-full">{db.enums.dealTypes.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="补充说明"><Textarea name="note" /></Field>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">提交线索</Button>
      </form>
    </div>
  );
}

export function PayForm({ token }: { token?: string }) {
  const { db, publicPay, studentById } = useCRM();
  const tok = token ? db.payTokens.find((t) => t.id === token) : undefined;
  if (token && (!tok || tok.expired)) {
    return <div data-screen-label="缴费链接失效"><Head title="缴费登记" desc="" /><EmptyState>链接已失效（可能被退回），请联系顾问重新发送。</EmptyState></div>;
  }
  const locked = !!tok;
  const student = tok ? studentById(tok.studentId) : undefined;
  const partners = db.partners.filter((p) => p.status === "active");
  return (
    <div data-screen-label={locked ? "定向缴费" : "合作方缴费"}>
      <Head title={locked ? `缴费登记 · ${student?.zhName}` : "合作方缴费 / 佣金填报"} desc="无支付网关，只登记金额与凭证；财务确认后归入该合作方佣金。提交后留在本页。" />
      <form onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        publicPay({ studentId: locked ? tok!.studentId : s(f, "studentId"), dealId: s(f, "dealId") || undefined, filerPartnerId: s(f, "filerPartnerId"), amount: Number(f.get("amount")), currency: s(f, "currency") as Currency, voucher: s(f, "voucher") || "upload.png", note: s(f, "note") });
        e.currentTarget.reset();
      }}>
        <Field label="填报人（合作方）"><Select name="filerPartnerId" className="w-full" defaultValue={tok?.partnerId || partners[0]?.id}>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        {locked
          ? <Field label="学生"><Input value={`${student?.zhName} / ${student?.enName}`} readOnly /></Field>
          : <Field label="学生"><Select name="studentId" className="w-full">{db.students.map((st) => <option key={st.id} value={st.id}>{st.zhName} / {st.enName}</option>)}</Select></Field>}
        <Field label="订单（可空）"><Select name="dealId" className="w-full"><option value="">不挂订单</option>{db.deals.filter((d) => !locked || d.studentId === tok!.studentId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
        <FormRow>
          <Field label="金额 *"><Input name="amount" type="number" required /></Field>
          <Field label="币种"><Select name="currency" className="w-full"><option>CNY</option><option>CAD</option></Select></Field>
        </FormRow>
        <Field label="凭证 *" hint="演示只记文件名"><Input name="voucher" placeholder="e-transfer.png" required /></Field>
        <Field label="结算备注"><Textarea name="note" /></Field>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">提交登记</Button>
      </form>
    </div>
  );
}
