"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useCRM } from "@/context/SessionContext";
import { TODAY } from "@/mock/seed";
import { PageHead } from "@/components/page-head";
import { Segmented } from "@/components/ui/tabs";
import { Metric, Panel } from "@/components/panel";
import { Select } from "@/components/ui/input";
import { money } from "@/lib/utils";
import { EmptyState } from "@/components/data-table";
import { typeStyle } from "@/components/type-chip";

const ResponsivePie = dynamic(() => import("@nivo/pie").then((m) => m.ResponsivePie), { ssr: false });

type Ccy = "CNY" | "CAD" | "全部";
const STAGE_ORDER = ["新机会", "跟进", "关闭"];
const LABEL_HEX: Record<string, string> = {
  "--label-guardian": "#579bfc",
  "--label-transfer": "#a25ddc",
  "--label-afterschool": "#fdab3d",
  "--label-credit": "#037f4c",
  "--label-university": "#0073ea",
  "--label-activity": "#ff158a",
  "--label-camp": "#ffcb00",
  "--label-private": "#ff5ac4",
  "--label-visa": "#7f5347",
  "--label-other": "#808080",
  "--label-done": "#00c875",
  "--label-stuck": "#e2445c",
};

function cssToHex(bg?: string) {
  if (!bg) return "#808080";
  const m = /^var\((--[\w-]+)\)/.exec(bg);
  return m ? LABEL_HEX[m[1]] ?? "#808080" : bg;
}

function stageColor(name: string) {
  return cssToHex(typeStyle(name, STAGE_ORDER)?.bg);
}

const THIS_YEAR = TODAY.slice(0, 4);
const MONTHS = [
  { v: "全部", l: "月份：全部" },
  ...Array.from({ length: 12 }, (_, i) => {
    const v = String(i + 1).padStart(2, "0");
    return { v, l: `${i + 1} 月` };
  }),
];

function StageDonut({ stages }: { stages: { s: string; n: number }[] }) {
  const total = stages.reduce((sum, x) => sum + x.n, 0);
  const [hover, setHover] = React.useState<string | number | null>(null);
  if (!total) return <EmptyState>该期间暂无机会。</EmptyState>;

  const slices = stages.filter((x) => x.n > 0);
  const multi = slices.length > 1;
  const data = slices.map((x) => ({ id: x.s, label: x.s, value: x.n, color: stageColor(x.s) }));

  return (
    <div className="flex h-56 items-center gap-4">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsivePie
          data={data}
          colors={{ datum: "data.color" }}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          innerRadius={0.62}
          padAngle={multi ? 2 : 0}
          cornerRadius={multi ? 12 : 0}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          animate={false}
          activeId={hover}
          onActiveIdChange={setHover}
          activeOuterRadiusOffset={4}
          borderWidth={0}
          role="img"
          theme={{
            text: { fill: "var(--color-text)", fontSize: 12, fontFamily: "inherit" },
            tooltip: { container: { background: "transparent", padding: 0, boxShadow: "none", border: "none" } },
          }}
          tooltip={({ datum }) => (
            <div className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-white px-3 py-1.5 text-sm shadow-card">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: datum.color }} />
              <span>{String(datum.label)}</span>
              <span className="font-semibold tabular-nums">{datum.value}</span>
            </div>
          )}
        />
      </div>
      <ul className="w-[4.75rem] shrink-0 space-y-2.5 text-sm">
        {stages.map((x) => (
          <li
            key={x.s}
            className="flex cursor-default items-center gap-2"
            onMouseEnter={() => x.n > 0 && setHover(x.s)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: stageColor(x.s) }} />
            <span className={hover === x.s ? "font-medium text-text" : "text-muted"}>{x.s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardPage() {
  const { db, user, formula, visibleCommissions, studentById } = useCRM();
  const [ccy, setCcy] = React.useState<Ccy>("全部");
  const [year, setYear] = React.useState(THIS_YEAR);
  const [month, setMonth] = React.useState("全部");
  if (!user) return null;

  const isAdvisor = user.role === "advisor";
  const scopeStu = new Set((isAdvisor ? db.students.filter((s) => s.advisorId === user.id) : db.students).map((s) => s.id));
  const inCcy = (x: { currency: string }) => ccy === "全部" || x.currency === ccy;
  const ccys: ("CNY" | "CAD")[] = ccy === "全部" ? ["CNY", "CAD"] : [ccy];
  const inPeriod = (iso?: string) => {
    if (!iso) return false;
    if (!iso.startsWith(year)) return false;
    if (month !== "全部" && iso.slice(5, 7) !== month) return false;
    return true;
  };

  const yearSet = new Set<string>([THIS_YEAR]);
  db.payments.forEach((p) => { if (p.createdAt) yearSet.add(p.createdAt.slice(0, 4)); });
  db.deals.forEach((d) => { if (d.closedAt) yearSet.add(d.closedAt.slice(0, 4)); });
  db.opportunities.forEach((o) => { if (o.openedAt) yearSet.add(o.openedAt.slice(0, 4)); });
  db.tasks.forEach((t) => { if (t.deadline) yearSet.add(t.deadline.slice(0, 4)); });
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));

  const paidBy = (c: string) => db.payments.filter((p) => p.status === "已付款" && p.currency === c && scopeStu.has(p.studentId) && inPeriod(p.createdAt)).reduce((s, p) => s + p.amount, 0);
  const oppBy = (c: string) => db.opportunities.filter((o) => o.status !== "关闭" && o.currency === c && scopeStu.has(o.studentId) && inPeriod(o.openedAt)).reduce((s, o) => s + o.amount, 0);
  const commDue = visibleCommissions.filter((c) => {
    const p = db.payments.find((x) => x.id === c.paymentId);
    return p && inCcy(p) && p.status === "已付款" && inPeriod(p.createdAt);
  }).reduce((s, c) => s + formula(c).wait, 0);
  const stages = ["新机会", "跟进", "关闭"].map((s) => ({ s, n: db.opportunities.filter((o) => o.status === s && scopeStu.has(o.studentId) && inPeriod(o.openedAt)).length }));
  const byType: Record<string, number> = {};
  db.deals.filter((d) => d.status === "成交" && inCcy(d) && scopeStu.has(d.studentId) && inPeriod(d.closedAt)).forEach((d) => { byType[d.type] = (byType[d.type] || 0) + d.amount; });
  const types = db.enums.dealTypes;
  const bars = types.map((t) => ({ t, v: byType[t] || 0 })).filter((b) => b.v > 0);
  const max = Math.max(1, ...bars.map((b) => b.v));
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((p) => Math.round(max * p));
  const tasks = db.tasks.filter((t) => (user.role === "owner" || t.assigneeId === user.id) && inPeriod(t.deadline));
  const doneN = tasks.filter((t) => t.status === "已完成").length;
  const calendar = db.services.filter((s) => s.status === "进行中" && scopeStu.has(s.studentId)).map((s) => ({ id: s.id, date: s.end, label: `${studentById(s.studentId)?.zhName} · ${s.name} 到期` }))
    .concat(db.opportunities.filter((o) => o.status !== "关闭" && scopeStu.has(o.studentId)).map((o) => ({ id: o.id, date: o.expireOn, label: `${studentById(o.studentId)?.zhName} · ${o.rec}` })))
    .filter((c) => c.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .slice(0, 6);

  return (
    <div data-screen-label="经营看板">
      <PageHead title="经营看板" desc="分币种展示，不做汇率换算。顾问只统计自己负责的学生。年月筛指标与柱图，不影响到期日历。" extra={
        <>
          <Select disabled={isAdvisor} defaultValue="全部" aria-label="负责人"><option>负责人：{isAdvisor ? user.name : "全部"}</option></Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="年份">
            {years.map((y) => <option key={y} value={y}>{y} 年</option>)}
          </Select>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="月份">
            {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </Select>
          <Segmented options={["CNY", "CAD", "全部"] as Ccy[]} value={ccy} onChange={setCcy} />
        </>
      } />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ccys.map((c) => <Metric key={"paid" + c} label={`已成交净额 · ${c}`} value={money(paidBy(c))} hint="只计已付款实收" />)}
        {ccys.map((c) => <Metric key={"opp" + c} label={`未结机会金额 · ${c}`} value={money(oppBy(c))} />)}
        <Metric label="已核准待返佣" value={money(commDue)} hint={ccy === "全部" ? "各币种合并计数，不换汇" : ccy} />
        <Metric label="任务完成进度" value={`${doneN} / ${tasks.length}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="按业务类型（成交金额）" className="lg:col-span-2">
          {!bars.length ? <EmptyState>该币种暂无成交。</EmptyState> : (
            <div className="flex h-56 gap-2">
              <div className="flex w-10 shrink-0 flex-col justify-between pb-7 pt-4 text-right text-[10px] tabular-nums text-muted">
                {ticks.map((n, i) => <span key={i}>{n.toLocaleString()}</span>)}
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-x-0 bottom-7 top-4 flex flex-col justify-between">
                  {ticks.map((_, i) => <div key={i} className="border-t border-border" />)}
                </div>
                <div className="absolute inset-x-0 bottom-7 top-4 flex items-end justify-around gap-1">
                  {bars.map(({ t, v }) => (
                    <div key={t} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                      <span className="mb-1 text-[11px] font-semibold tabular-nums">{money(v)}</span>
                      <div
                        className="w-[55%] max-w-12 rounded-t-sm"
                        style={{ height: `${(v / max) * 100}%`, minHeight: 4, backgroundColor: typeStyle(t, types)?.bg }}
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-7 items-start justify-around gap-1">
                  {bars.map(({ t }) => (
                    <span key={t} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted" title={t}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>
        <Panel title="续费机会阶段">
          <StageDonut stages={stages} />
        </Panel>
        <Panel title="到期与续费行动日历" className="lg:col-span-3">
          {!calendar.length ? <EmptyState>无到期项。</EmptyState> : (
            <ul className="divide-y divide-border">
              {calendar.map((c) => <li key={c.id} className="flex items-center gap-3 py-2 text-sm"><code className="text-xs text-muted">{c.date}</code><span className="truncate">{c.label}</span></li>)}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
