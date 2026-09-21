"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { homeFor } from "@/lib/nav";
import { Input } from "@/components/ui/input";
import { withBase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";

const ACCOUNTS = [
  { email: "advisor@demo", label: "顾问 · 陈顾问" },
  { email: "wang@demo", label: "顾问 · 王顾问（对照看全部改自己的）" },
  { email: "owner@demo", label: "老板 · 高老板（全部页面可读写）" },
  { email: "finance@demo", label: "财务 · 李财务" },
];

const PUBLIC_LINKS = [
  { label: "老师课时填报", path: "/p/teacher" },
  { label: "合作方新学生线索", path: "/p/partner" },
  { label: "合作方缴费 / 佣金填报", path: "/p/pay" },
];

export function LoginPage() {
  const { login } = useCRM();
  const router = useRouter();
  const [email, setEmail] = React.useState("advisor@demo");
  const [password, setPassword] = React.useState("demo");
  const [err, setErr] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = login(email.trim(), password);
    if (!r.ok || !r.user) { setErr(r.error || "登录失败"); return; }
    router.push(homeFor(r.user.role));
  }

  return (
    <div className="grid min-h-screen bg-sidebar lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between p-12 text-slate-300 lg:flex">
        <div className="font-display text-2xl font-semibold text-white">FX International CRM</div>
        <div>
          <p className="max-w-md font-display text-4xl leading-tight text-white">学生、订单、服务、课时、收费<br />一张表看全，只改自己的。</p>
          <p className="mt-4 max-w-md text-sm text-slate-400">内部演示原型 · 数据为 mock，保存在本标签页内；侧栏「还原数据」可一键回到初始状态。三种角色分别登录，观察侧栏与写权限的差别。</p>
        </div>
        <div className="text-xs text-slate-500">2026-09-21 · 起点原型</div>
      </div>
      <div className="flex items-center justify-center bg-bg p-6">
        <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-card">
          <h1 className="text-xl font-semibold">登录</h1>
          <p className="mb-5 mt-1 text-sm text-muted">密码统一为 <code className="rounded bg-slate-100 px-1">demo</code></p>
          <Field label="邮箱"><Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
          <Field label="密码"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          {err ? <p className="mb-3 text-sm text-danger">{err}</p> : null}
          <Button type="submit" variant="primary" className="w-full">登录</Button>
          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-2 text-xs text-muted">演示账号（点击填入）</div>
            <div className="grid gap-1">
              {ACCOUNTS.map((a) => (
                <button key={a.email} type="button" onClick={() => setEmail(a.email)} className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50">
                  <span>{a.label}</span>
                  <code className="text-xs text-muted">{a.email}</code>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 text-xs text-muted">免登录公开表单（老师 / 合作方无账号，只收链接）</div>
            <div className="grid gap-1">
              {PUBLIC_LINKS.map((l) => (
                <a key={l.path} href={withBase(l.path)} target="_blank" rel="noopener" className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-primary hover:bg-blue-50">
                  <span>{l.label}</span>
                  <code className="text-xs text-muted">{l.path}</code>
                </a>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
