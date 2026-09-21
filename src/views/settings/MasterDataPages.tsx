"use client";

import * as React from "react";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormRow } from "@/components/field";
import { StatusPill } from "@/components/status-pill";
import { Panel } from "@/components/panel";
import { PublicLinkBar } from "@/components/public-link-bar";
import { TypeChip } from "@/components/type-chip";
import { kwMatch, withBase } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/nav";
import type { Role, User, Partner } from "@/api/types";
import { toast } from "sonner";

const cellCls = "w-full min-w-[6.5rem] border-primary bg-blue-50 py-1 text-sm text-primary";

function TextCell({ value, onSave, required, type = "text" }: { value?: string; onSave: (v: string) => void; required?: boolean; type?: string }) {
  const [draft, setDraft] = React.useState(value || "");
  React.useEffect(() => { setDraft(value || ""); }, [value]);
  function commit() {
    const v = draft.trim();
    if (required && !v) {
      setDraft(value || "");
      toast.error("该项不能为空");
      return;
    }
    if (v !== (value || "")) onSave(v);
  }
  return (
    <Input
      type={type}
      value={draft}
      className={cellCls}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

export function UsersPage() {
  const { db, userById, addUser, handover } = useCRM();
  const [kw, setKw] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [ho, setHo] = React.useState<User | null>(null);
  const rows = db.users.filter((u) => kwMatch(u, kw, ["name", "email", "role"]));
  const advisors = db.users.filter((u) => u.role === "advisor" && u.status === "active");

  return (
    <div data-screen-label="账号与角色">
      <PageHead title="账号与角色" desc="仅老板可见。三角色菜单裁剪；离职交接会批量改派学生与未结任务并停用账号。" extra={<Button variant="primary" onClick={() => setOpen(true)}>新建账号</Button>} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => setKw("")} />
      <DataTable rows={rows} columns={[
        { key: "name", label: "姓名", render: (u) => <b>{u.name}</b> },
        { key: "email", label: "登录名" },
        { key: "role", label: "角色", render: (u) => ROLE_LABEL[u.role] },
        { key: "supervisor", label: "主管", render: (u) => u.supervisorId ? userById(u.supervisorId)?.name : (u.role === "advisor" ? "（空→老板）" : "—") },
        { key: "students", label: "负责学生", render: (u) => u.role === "advisor" ? db.students.filter((s) => s.advisorId === u.id).length : "—" },
        { key: "status", label: "状态", render: (u) => <StatusPill value={u.status} /> },
        { key: "act", label: "操作", render: (u) => u.role === "advisor" && u.status === "active" ? <Button size="sm" onClick={() => setHo(u)}>离职交接</Button> : "—" },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title="新建账号">
        <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addUser({ name: String(f.get("name")), email: String(f.get("email")), role: String(f.get("role")) as Role, supervisorId: String(f.get("supervisorId")) || undefined }); setOpen(false); }}>
          <FormRow>
            <Field label="姓名"><Input name="name" required /></Field>
            <Field label="登录名"><Input name="email" required placeholder="name@demo" /></Field>
            <Field label="角色"><Select name="role" className="w-full"><option value="advisor">顾问</option><option value="finance">财务</option><option value="owner">老板</option></Select></Field>
            <Field label="主管（可空）"><Select name="supervisorId" className="w-full"><option value="">空 → 老板</option>{db.users.filter((u) => u.role === "owner").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
          </FormRow>
          <Field label="初始密码"><Input name="pwd" defaultValue="demo" /></Field>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>
      <Dialog open={!!ho} onClose={() => setHo(null)} title="离职交接">
        {ho ? (
          <form onSubmit={(e) => { e.preventDefault(); const to = String(new FormData(e.currentTarget).get("toId")); if (to === ho.id) { toast.error("不能交接给本人"); return; } handover(ho.id, to); setHo(null); }}>
            <p className="mb-3 text-sm">把 <b>{ho.name}</b> 的 {db.students.filter((s) => s.advisorId === ho.id).length} 名学生、未结任务、服务与机会批量改派，并停用其账号。</p>
            <Field label="目标顾问"><Select name="toId" className="w-full">{advisors.filter((a) => a.id !== ho.id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
            <Button type="submit" variant="danger">执行交接</Button>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}

export function TeachersPage() {
  const { db, addTeacher, toggleTeacher, patchTeacher } = useCRM();
  const [kw, setKw] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rows = db.teachers.filter((t) => kwMatch(t, kw, ["zhName", "enName", "phone"]));
  return (
    <div data-screen-label="老师主数据">
      <PageHead title="老师主数据" desc="老师无登录。停用后公开课时表下拉消失，历史课时保留名字。" extra={<Button variant="primary" onClick={() => setOpen(true)}>新建老师</Button>} />
      <PublicLinkBar links={[{ label: "老师课时填报", path: "/p/teacher", note: "所有生效老师共用一条链接" }]} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => setKw("")} />
      <DataTable rows={rows} columns={[
        { key: "zhName", label: "中文名", render: (t) => <b>{t.zhName}</b> },
        { key: "enName", label: "英文名" },
        { key: "phone", label: "联系电话", render: (t) => <TextCell value={t.phone} onSave={(v) => patchTeacher(t.id, { phone: v || undefined })} /> },
        { key: "hours", label: "已通过课时", render: (t) => db.hours.filter((h) => h.teacherId === t.id && h.status === "已通过").reduce((s, h) => s + h.planned, 0) },
        { key: "status", label: "状态", render: (t) => <StatusPill value={t.status} /> },
        { key: "act", label: "操作", render: (t) => <Button size="sm" onClick={() => toggleTeacher(t.id)}>{t.status === "active" ? "停用" : "启用"}</Button> },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title="新建老师">
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          addTeacher({ zhName: String(f.get("zhName")), enName: String(f.get("enName")), phone: String(f.get("phone") || "") || undefined });
          setOpen(false);
        }}>
          <FormRow>
            <Field label="中文名 *"><Input name="zhName" required /></Field>
            <Field label="英文名 *"><Input name="enName" required /></Field>
            <Field label="联系电话"><Input name="phone" /></Field>
          </FormRow>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>
    </div>
  );
}

export function PartnersPage() {
  const { db, addPartner, togglePartner, patchPartner } = useCRM();
  const [kw, setKw] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rows = db.partners.filter((p) => kwMatch(p, kw, ["name", "type", "contact", "phone", "email"]));
  return (
    <div data-screen-label="合作方主数据">
      <PageHead title="合作方主数据" desc="合作方无登录。公开收费页只能选生效合作方、不能新建；线索表手填的新名称在指派完成时入库。" extra={<Button variant="primary" onClick={() => setOpen(true)}>新建合作方</Button>} />
      <PublicLinkBar links={[
        { label: "新学生线索", path: "/p/partner", note: "无金额、无凭证" },
        { label: "缴费 / 佣金填报", path: "/p/pay", note: "定向缴费链接在学生 360 里生成" },
      ]} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => setKw("")} />
      <DataTable rows={rows} columns={[
        { key: "name", label: "合作人名称", render: (p) => <b>{p.name}</b> },
        { key: "type", label: "类型", render: (p) => (
          <Select
            className={cellCls}
            value={p.type}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => patchPartner(p.id, { type: e.target.value as Partner["type"] })}
          >
            <option>单位</option>
            <option>个人</option>
          </Select>
        ) },
        { key: "contact", label: "合作方联系人", render: (p) => <TextCell value={p.contact} required onSave={(v) => patchPartner(p.id, { contact: v })} /> },
        { key: "phone", label: "合作方电话", render: (p) => <TextCell value={p.phone} required onSave={(v) => patchPartner(p.id, { phone: v })} /> },
        { key: "email", label: "合作方邮箱", render: (p) => <TextCell value={p.email} type="email" onSave={(v) => patchPartner(p.id, { email: v || undefined })} /> },
        { key: "students", label: "关联学生", render: (p) => db.students.filter((s) => s.partnerId === p.id).length },
        { key: "status", label: "状态", render: (p) => <StatusPill value={p.status} /> },
        { key: "act", label: "操作", render: (p) => <Button size="sm" onClick={() => togglePartner(p.id)}>{p.status === "active" ? "停用" : "启用"}</Button> },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title="新建合作方">
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          addPartner({
            name: String(f.get("name")),
            type: String(f.get("type")) as "单位" | "个人",
            contact: String(f.get("contact") || "") || undefined,
            phone: String(f.get("phone") || "") || undefined,
            email: String(f.get("email") || "") || undefined,
          });
          setOpen(false);
        }}>
          <FormRow>
            <Field label="合作人名称 *"><Input name="name" required /></Field>
            <Field label="类型"><Select name="type" className="w-full"><option>单位</option><option>个人</option></Select></Field>
            <Field label="合作方联系人 *"><Input name="contact" required /></Field>
            <Field label="合作方电话 *"><Input name="phone" required /></Field>
            <Field label="合作方邮箱"><Input name="email" type="email" /></Field>
          </FormRow>
          <Button type="submit" variant="primary">保存</Button>
        </form>
      </Dialog>
    </div>
  );
}

export function EnumsPage() {
  const { db, addEnum } = useCRM();
  const [v1, setV1] = React.useState("");
  const [v2, setV2] = React.useState("");
  return (
    <div data-screen-label="业务枚举">
      <PageHead title="业务枚举" desc="业务类型、任务类型可维护；业务表只下拉不手打。优先级 / 各状态为固定枚举。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="业务 / 订单 / 服务类型">
          <div className="mb-3 flex flex-wrap gap-1.5">{db.enums.dealTypes.map((t) => <TypeChip key={t} value={t} siblings={db.enums.dealTypes} />)}</div>
          <p className="mb-2 text-xs text-muted">前 10 项为固定色；新加的类型按名称自动分配颜色。</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addEnum("dealTypes", v1.trim()); setV1(""); }}>
            <Input value={v1} onChange={(e) => setV1(e.target.value)} placeholder="新类型" /><Button type="submit">加入</Button>
          </form>
        </Panel>
        <Panel title="任务类型">
          <div className="mb-3 flex flex-wrap gap-1.5">{db.enums.taskTypes.map((t) => <TypeChip key={t} value={t} siblings={db.enums.taskTypes} />)}</div>
          <p className="mb-2 text-xs text-muted">新加的类型按名称自动分配颜色。</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addEnum("taskTypes", v2.trim()); setV2(""); }}>
            <Input value={v2} onChange={(e) => setV2(e.target.value)} placeholder="新类型" /><Button type="submit">加入</Button>
          </form>
        </Panel>
        <Panel title="固定枚举（只读）">
          <div className="space-y-3">
            <EnumPreview label="订单状态" values={["潜在", "跟进", "成交", "失单", "暂停"]} />
            <EnumPreview label="收费四态" values={["已登记", "待确认", "未付款", "已付款", "退回"]} />
            <EnumPreview label="课时审核" values={["已提交", "已通过", "退回"]} />
            <EnumPreview label="出勤" values={["正常", "迟到", "缺席", "请假", "早退", "其他"]} />
            <EnumPreview label="机会" values={["续费", "二销", "新机会", "跟进", "关闭"]} />
            <EnumPreview label="学生" values={["Active", "暂停", "Alumni", "Lost"]} />
            <EnumPreview label="优先级" values={["高", "中", "低"]} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EnumPreview({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">{values.map((t) => <TypeChip key={t} value={t} siblings={values} />)}</div>
    </div>
  );
}

export function ImportPage() {
  const { fakeImport } = useCRM();
  const [file, setFile] = React.useState("");
  return (
    <div data-screen-label="Excel导入">
      <PageHead title="Excel 导入" desc="演示不读真实文件。学生编号由系统生成，模板不要填。去重顺序：手机 > 微信 > 中文名+英文名；失败给行号；CLV 按已付款重算。" />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title="步骤">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              下载模板{" "}
              <a href={withBase("/CRM导入模板-学生档案与剩余课时.xlsx")} download className="font-medium text-primary underline">
                CRM导入模板-学生档案与剩余课时.xlsx
              </a>
              （档案一人一行；课时按服务多行；学生编号导入后系统生成）。
            </li>
            <li>按列填写，不改表头。老师、合作方须已在主数据。服务表「学生」须与档案「中文名」一致。</li>
            <li>上传后按 手机 &gt; 微信 &gt; 中文名+英文名 匹配；重复手机合并不新建。</li>
            <li>无顾问 / 无来源 / 手机碰撞进「待清洗」，管理端补全后放出。</li>
          </ol>
          <div className="mt-4 rounded-md border-2 border-dashed border-border p-6 text-center">
            <Input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0]?.name || "")} className="mx-auto max-w-xs" />
            <p className="mt-2 text-xs text-muted">{file ? `已选：${file}` : "选择文件（演示不解析）"}</p>
            <Button variant="primary" className="mt-3" onClick={fakeImport}>开始导入</Button>
          </div>
        </Panel>
        <Panel title="上次结果（演示）">
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between"><span>成功</span><b>2</b></li>
            <li className="flex justify-between"><span>跳过（重复手机）</span><b>0</b></li>
            <li className="flex justify-between"><span>待清洗</span><b className="text-warning">1</b></li>
            <li className="flex justify-between"><span>失败行号</span><span>—</span></li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
