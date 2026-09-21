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
import { Field, FormRow } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { TypeChip, TypeSelect } from "@/components/type-chip";
import { kwMatch } from "@/lib/utils";
import type { Task } from "@/api/types";

export function TasksPage() {
  const { db, user, userById, studentById, addTask, setTaskStatus } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [status, setStatus] = React.useState("全部");
  const [priority, setPriority] = React.useState("全部");
  const [type, setType] = React.useState("全部");
  const [assignee, setAssignee] = React.useState("全部");
  const [open, setOpen] = React.useState(false);
  if (!user) return null;

  let rows = db.tasks.slice();
  if (user.role === "advisor") rows = rows.filter((t) => t.assigneeId === user.id);
  if (status !== "全部") rows = rows.filter((t) => t.status === status);
  if (priority !== "全部") rows = rows.filter((t) => t.priority === priority);
  if (type !== "全部") rows = rows.filter((t) => t.type === type);
  if (assignee !== "全部") rows = rows.filter((t) => t.assigneeId === assignee);
  rows = rows.filter((t) => kwMatch(t, kw, ["title", "type"]) || (studentById(t.studentId)?.zhName || "").includes(kw));
  rows.sort((a, b) => a.deadline.localeCompare(b.deadline));
  const mine = user.role === "owner" ? db.students : db.students.filter((s) => s.advisorId === user.id);

  return (
    <div data-screen-label="顾问任务">
      <PageHead title="顾问任务" desc="顾问只能给自己负责的学生建任务；今日 / 明日的会出现在工作台。学习跟进只是类型，无学习计划模块。" extra={<Button variant="primary" onClick={() => setOpen(true)}>新建任务</Button>} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setStatus("全部"); setPriority("全部"); setType("全部"); setAssignee("全部"); }}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="全部">状态：全部</option><option>待开始</option><option>进行中</option><option>已完成</option></Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="全部">优先级：全部</option><option>高</option><option>中</option><option>低</option></Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="全部">类型：全部</option>{db.enums.taskTypes.map((t) => <option key={t}>{t}</option>)}</Select>
        {user.role === "owner" ? <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="全部">负责人：全部</option>{db.users.filter((u) => u.role === "advisor").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select> : null}
      </FilterBar>
      <DataTable rows={rows} onRow={(t) => router.push("/students/" + t.studentId)} columns={[
        { key: "title", label: "事项", render: (t) => <b>{t.title}</b> },
        { key: "student", label: "学生", render: (t) => studentById(t.studentId)?.zhName },
        { key: "type", label: "类型", render: (t) => <TypeChip value={t.type} siblings={db.enums.taskTypes} /> },
        { key: "deadline", label: "Deadline" },
        { key: "assignee", label: "负责人", render: (t) => userById(t.assigneeId)?.name },
        { key: "priority", label: "优先级", render: (t) => <StatusPill value={t.priority} /> },
        { key: "status", label: "状态", render: (t) => (
          <TypeSelect aria-label="状态" options={["待开始", "进行中", "已完成"]} value={t.status} onChange={(v) => setTaskStatus(t.id, v as Task["status"])} />
        ) },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title="新建任务">
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addTask({ studentId: String(f.get("studentId")), title: String(f.get("title")), deadline: String(f.get("deadline")), type: String(f.get("type")), priority: String(f.get("priority")) as Task["priority"], note: String(f.get("note")) }); setOpen(false); }}>
          <Field label="学生（仅自己负责）"><Select name="studentId" className="w-full">{mine.map((s) => <option key={s.id} value={s.id}>{s.zhName}</option>)}</Select></Field>
          <Field label="事项"><Input name="title" required /></Field>
          <FormRow>
            <Field label="Deadline"><Input name="deadline" type="date" required /></Field>
            <Field label="优先级"><TypeSelect name="priority" aria-label="优先级" options={["高", "中", "低"]} defaultValue="中" /></Field>
          </FormRow>
          <Field label="类型"><TypeSelect name="type" aria-label="任务类型" options={db.enums.taskTypes} /></Field>
          <Field label="说明"><Textarea name="note" /></Field>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>
    </div>
  );
}
