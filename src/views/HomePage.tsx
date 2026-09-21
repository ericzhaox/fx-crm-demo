"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCRM } from "@/context/SessionContext";
import { TODAY, TOMORROW } from "@/mock/seed";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { TypeChip } from "@/components/type-chip";
import { EmptyState } from "@/components/data-table";

type Item = { key: string; kind: string; title: string; meta: string; studentId: string };

const KINDS = ["全部", "今日任务", "明日任务", "课时≤10", "签证≤45", "Offer≤45"];

export function HomePage() {
  const { db, user, remain, daysUntil, studentById, ackReminder } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [kind, setKind] = React.useState("全部");
  const [done, setDone] = React.useState("未处理");
  if (!user) return null;

  const isOwner = user.role === "owner";
  const mine = isOwner ? db.students : db.students.filter((s) => s.advisorId === user.id);
  const mineIds = new Set(mine.map((s) => s.id));
  const myTask = (t: (typeof db.tasks)[number]) => isOwner || t.assigneeId === user.id;

  let items: Item[] = [
    ...db.tasks.filter((t) => t.deadline === TODAY && t.status !== "已完成" && myTask(t)).map((t) => ({ key: "tk-" + t.id, kind: "今日任务", title: t.title, meta: studentById(t.studentId)?.zhName || "", studentId: t.studentId })),
    ...db.tasks.filter((t) => t.deadline === TOMORROW && t.status !== "已完成" && myTask(t)).map((t) => ({ key: "tk-" + t.id, kind: "明日任务", title: t.title, meta: studentById(t.studentId)?.zhName || "", studentId: t.studentId })),
    ...db.services.filter((sv) => mineIds.has(sv.studentId) && sv.status === "进行中" && remain(sv) <= 10).map((sv) => ({ key: "hw-" + sv.id, kind: "课时≤10", title: `${studentById(sv.studentId)?.zhName} · ${sv.name}`, meta: `剩余 ${remain(sv)} 小时`, studentId: sv.studentId })),
    ...mine.filter((s) => daysUntil(s.visaExpires) <= 45).map((s) => ({ key: "visa-" + s.id, kind: "签证≤45", title: s.zhName, meta: `${s.visaExpires}（${daysUntil(s.visaExpires)} 天）`, studentId: s.id })),
    ...mine.filter((s) => daysUntil(s.offerExpires) <= 45).map((s) => ({ key: "offer-" + s.id, kind: "Offer≤45", title: s.zhName, meta: `${s.offerExpires}（${daysUntil(s.offerExpires)} 天）`, studentId: s.id })),
  ];
  const acked = (it: Item) => db.reminderAcks.some((a) => a.key === it.key && a.userId === user.id);
  if (kind !== "全部") items = items.filter((x) => x.kind === kind);
  if (done === "未处理") items = items.filter((x) => !acked(x));
  if (done === "已处理") items = items.filter((x) => acked(x));
  if (kw) items = items.filter((x) => (x.title + x.meta).includes(kw));

  const groups = KINDS.slice(1).map((k) => ({ k, list: items.filter((x) => x.kind === k) })).filter((g) => g.list.length);

  return (
    <div data-screen-label="工作台">
      <PageHead title="工作台" desc="今日 / 明日任务，以及课时≤10、签证 / Offer≤45。续费 T-90 在「续费/二销」。" />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setKind("全部"); setDone("未处理"); }}>
        <Select value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</Select>
        <Select value={done} onChange={(e) => setDone(e.target.value)}><option>未处理</option><option>已处理</option><option>全部</option></Select>
      </FilterBar>
      {!items.length ? <EmptyState>今天没有待办提醒。</EmptyState> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <section key={g.k} className="rounded-lg border border-border bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <StatusPill value={g.k} />
                <span className="text-xs text-muted">{g.list.length} 项</span>
              </div>
              <ul className="divide-y divide-border">
                {g.list.map((it) => {
                  const doneChip = acked(it) ? "已处理" : "未处理";
                  return (
                  <li key={it.key} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-blue-50/40">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => router.push("/students/" + it.studentId)}>
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      <div className="text-xs text-muted">{it.meta}</div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <TypeChip value={doneChip} siblings={["未处理", "已处理"]} />
                      {doneChip === "未处理" ? <Button size="sm" onClick={() => ackReminder(it.key)}>标记已处理</Button> : null}
                    </div>
                  </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
