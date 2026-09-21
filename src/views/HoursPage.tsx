"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { TypeSelect } from "@/components/type-chip";
import { Badge } from "@/components/ui/badge";
import { HourLessonFields, StarRating, clipText, readHourLesson, validateHourLesson } from "@/components/hour-lesson-fields";
import { kwMatch } from "@/lib/utils";
import { ATTENDANCE, type HourEntry } from "@/api/types";
import { toast } from "sonner";

export function HoursPage() {
  const { db, user, studentById, teacherById, reviewHour, returnHour, addHourAdvisor, canWriteStudent } = useCRM();
  const [kw, setKw] = React.useState("");
  const [status, setStatus] = React.useState("已提交");
  const [subject, setSubject] = React.useState("全部");
  const [review, setReview] = React.useState<HourEntry | null>(null);
  const [ret, setRet] = React.useState<HourEntry | null>(null);
  const [add, setAdd] = React.useState(false);
  if (!user) return null;

  let rows = db.hours.slice();
  if (user.role === "advisor") {
    const mine = new Set(db.students.filter((s) => s.advisorId === user.id).map((s) => s.id));
    rows = rows.filter((h) => mine.has(h.studentId));
  }
  if (status !== "全部") rows = rows.filter((h) => h.status === status);
  if (subject !== "全部") rows = rows.filter((h) => h.subject === subject);
  rows = rows.filter((h) => kwMatch(h, kw, ["title", "subject", "summary", "homeworkNote", "attachmentName"]) || (studentById(h.studentId)?.zhName || "").includes(kw) || (teacherById(h.teacherId)?.zhName || "").includes(kw));
  const subjects = Array.from(new Set(db.hours.map((h) => h.subject)));
  const mineStu = user.role === "owner" ? db.students : db.students.filter((s) => s.advisorId === user.id);
  const canReview = (h: HourEntry) => h.status === "已提交" && (h.initiator === "advisor" ? user.role === "owner" : canWriteStudent(studentById(h.studentId)));
  const defaultPlanned = (h: HourEntry) => (h.attendance === "请假" || h.attendance === "缺席" ? 0 : h.hours);

  return (
    <div data-screen-label="课时审核">
      <PageHead title="课时审核" desc="默认待审表。通过弹二次确认：拟计入可改，请假 / 缺席默认 0；退回填原因，原单只读。顾问代填的单只能老板审。" extra={<Button onClick={() => setAdd(true)}>顾问代填课时</Button>} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setStatus("已提交"); setSubject("全部"); }}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option>已提交</option><option>已通过</option><option>退回</option><option>全部</option></Select>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)}><option value="全部">科目：全部</option>{subjects.map((s) => <option key={s}>{s}</option>)}</Select>
      </FilterBar>
      <DataTable rows={rows} empty="待审队列为空。" columns={[
        { key: "title", label: "标题", render: (h) => <span className="inline-flex items-center gap-2"><b>{h.title}</b>{h.initiator === "advisor" ? <Badge tone="blue">顾问代填</Badge> : null}</span> },
        { key: "student", label: "学生", render: (h) => studentById(h.studentId)?.zhName },
        { key: "teacher", label: "老师", render: (h) => teacherById(h.teacherId)?.zhName || "—" },
        { key: "date", label: "上课", render: (h) => `${h.date} ${h.start}` },
        { key: "subject", label: "科目" },
        { key: "summary", label: "授课内容", render: (h) => clipText(h.summary) },
        { key: "performance", label: "课堂表现", render: (h) => <StarRating value={h.performance} /> },
        { key: "attachment", label: "课堂附件", render: (h) => h.attachmentName || "—" },
        { key: "homework", label: "作业安排与老师备注", render: (h) => clipText(h.homeworkNote) },
        { key: "attendance", label: "出勤", render: (h) => <StatusPill value={h.attendance} /> },
        { key: "hours", label: "填报 / 拟计入", render: (h) => `${h.hours} / ${h.status === "已通过" ? h.planned : "—"}` },
        { key: "status", label: "状态", render: (h) => <StatusPill value={h.status} /> },
        { key: "act", label: "操作", render: (h) => h.status !== "已提交" ? (h.returnReason ? <span className="text-xs text-muted">退回：{h.returnReason}</span> : "—") : canReview(h) ? (
          <span className="flex gap-1">
            <Button size="sm" variant="primary" onClick={() => setReview(h)}>通过</Button>
            <Button size="sm" variant="danger" onClick={() => setRet(h)}>退回</Button>
          </span>
        ) : <span className="text-xs text-muted">{h.initiator === "advisor" ? "待老板审" : "非本人学生"}</span> },
      ]} />

      <Dialog open={!!review} onClose={() => setReview(null)} title="二次确认拟计入">
        {review ? (
          <form onSubmit={(e) => { e.preventDefault(); reviewHour(review.id, Number(new FormData(e.currentTarget).get("planned"))); setReview(null); }}>
            <dl className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-sm">
              <dt className="text-muted">学生</dt><dd>{studentById(review.studentId)?.zhName}</dd>
              <dt className="text-muted">出勤</dt><dd><StatusPill value={review.attendance} /></dd>
              <dt className="text-muted">表填课时</dt><dd>{review.hours}</dd>
              <dt className="text-muted">授课内容</dt><dd>{review.summary || "—"}</dd>
              <dt className="text-muted">课堂表现</dt><dd><StarRating value={review.performance} /></dd>
              <dt className="text-muted">课堂附件</dt><dd>{review.attachmentName || "—"}</dd>
              <dt className="text-muted">作业安排与老师备注</dt><dd>{review.homeworkNote || "—"}</dd>
            </dl>
            <Field label="拟计入课时" hint="请假 / 缺席默认 0，仍可改成正数。确认后服务已完成 += 拟计入。"><Input name="planned" type="number" step="0.5" min="0" defaultValue={defaultPlanned(review)} /></Field>
            <Button type="submit" variant="primary">确认通过</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={!!ret} onClose={() => setRet(null)} title="退回课时">
        {ret ? (
          <form onSubmit={(e) => { e.preventDefault(); returnHour(ret.id, String(new FormData(e.currentTarget).get("reason"))); setRet(null); }}>
            <p className="mb-3 text-sm">{ret.title}。退回后作废只读，不扣课时，需重填新单。</p>
            <Field label="原因"><Textarea name="reason" required /></Field>
            <Button type="submit" variant="danger">退回</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={add} onClose={() => setAdd(false)} title="顾问代填课时">
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const s = (k: string) => String(f.get(k) ?? "");
          const lesson = readHourLesson(f);
          const msg = validateHourLesson(lesson);
          if (msg) { toast.error(msg); return; }
          addHourAdvisor({ title: s("title"), studentId: s("studentId"), serviceId: s("serviceId") || undefined, teacherId: s("teacherId"), subject: s("subject"), attendance: s("attendance") as HourEntry["attendance"], date: s("date"), start: s("start"), hours: Number(f.get("hours")), ...lesson });
          setAdd(false);
        }}>
          <Field label="标题 *"><Input name="title" required /></Field>
          <FormRow>
            <Field label="学生（自己负责） *"><Select name="studentId" className="w-full" required>{mineStu.map((s) => <option key={s.id} value={s.id}>{s.zhName}</option>)}</Select></Field>
            <Field label="服务（可空）"><Select name="serviceId" className="w-full"><option value="">无</option>{db.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="老师 *"><Select name="teacherId" className="w-full" required>{db.teachers.filter((t) => t.status === "active").map((t) => <option key={t.id} value={t.id}>{t.zhName}</option>)}</Select></Field>
            <Field label="科目 *"><Input name="subject" required /></Field>
            <Field label="出勤 *"><TypeSelect name="attendance" aria-label="出勤" options={[...ATTENDANCE]} /></Field>
            <Field label="本次课时（小时） *"><Input name="hours" type="number" step="0.5" required /></Field>
            <Field label="日期 *"><Input name="date" type="date" required /></Field>
            <Field label="开始 *"><Input name="start" type="time" required /></Field>
          </FormRow>
          <HourLessonFields />
          <p className="mb-3 text-xs text-muted">提交人 ≠ 审核人：顾问代填的单只能老板通过。</p>
          <Button type="submit" variant="primary">提交</Button>
        </form>
      </Dialog>
    </div>
  );
}
