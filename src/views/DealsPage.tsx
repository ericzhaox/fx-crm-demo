"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCRM } from "@/context/SessionContext";
import { PageHead } from "@/components/page-head";
import { FilterBar } from "@/components/filter-bar";
import { DataTable } from "@/components/data-table";
import { Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/tabs";
import { StatusPill } from "@/components/status-pill";
import { TypeChip, TypeSelect } from "@/components/type-chip";
import { kwMatch, money, cn } from "@/lib/utils";
import { DEAL_STAGES, type Deal, type DealStatus } from "@/api/types";

const BOARD_COLS: DealStatus[] = ["潜在", "跟进"];

export function DealsPage() {
  const { db, user, userById, studentById, partnerById, setDealStatus, canWriteStudent } = useCRM();
  const router = useRouter();
  const [kw, setKw] = React.useState("");
  const [status, setStatus] = React.useState("全部");
  const [type, setType] = React.useState("全部");
  const [owner, setOwner] = React.useState("全部");
  const [ccy, setCcy] = React.useState("全部");
  const [view, setView] = React.useState<"列表" | "进行中看板">("列表");
  const [active, setActive] = React.useState<Deal | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  if (!user) return null;

  let rows = db.deals.slice();
  if (status !== "全部") rows = rows.filter((d) => d.status === status);
  if (type !== "全部") rows = rows.filter((d) => d.type === type);
  if (owner !== "全部") rows = rows.filter((d) => d.ownerId === owner);
  if (ccy !== "全部") rows = rows.filter((d) => d.currency === ccy);
  rows = rows.filter((d) => kwMatch(d, kw, ["name", "type"]) || (studentById(d.studentId)?.zhName || "").includes(kw));
  const board = rows.filter((d) => BOARD_COLS.includes(d.status));
  const ownerOptions = user.role === "advisor" ? db.users.filter((u) => u.id === user.id) : db.users.filter((u) => u.role === "advisor");

  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const dealId = String(e.active.id);
    const to = e.over?.id as DealStatus | undefined;
    const deal = db.deals.find((d) => d.id === dealId);
    if (!deal || !to || deal.status === to) return;
    setDealStatus(dealId, to);
  }

  return (
    <div data-screen-label="订单列表">
      <PageHead title="订单" desc="默认高密度表；看板只放潜在 + 跟进，成交 / 失单 / 暂停留在表里。一生多单，成交可不挂服务。" extra={<Segmented options={["列表", "进行中看板"]} value={view} onChange={setView} />} />
      <FilterBar keyword={kw} onKeyword={setKw} onReset={() => { setKw(""); setStatus("全部"); setType("全部"); setOwner("全部"); setCcy("全部"); }}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="全部">状态：全部</option>{DEAL_STAGES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="全部">类型：全部</option>{db.enums.dealTypes.map((t) => <option key={t}>{t}</option>)}</Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="全部">负责人：全部</option>{ownerOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select value={ccy} onChange={(e) => setCcy(e.target.value)}><option value="全部">币种：全部</option><option>CNY</option><option>CAD</option></Select>
      </FilterBar>

      {view === "列表" ? (
        <DataTable rows={rows} onRow={(d) => router.push("/students/" + d.studentId)} columns={[
          { key: "name", label: "订单", render: (d) => <b>{d.name}</b> },
          { key: "student", label: "学生", render: (d) => studentById(d.studentId)?.zhName },
          { key: "type", label: "类型", render: (d) => <TypeChip value={d.type} siblings={db.enums.dealTypes} /> },
          { key: "amount", label: "金额", render: (d) => money(d.amount, d.currency) },
          { key: "owner", label: "负责人", render: (d) => userById(d.ownerId)?.name },
          { key: "partner", label: "合作方", render: (d) => partnerById(d.partnerId)?.name || "—" },
          { key: "closedAt", label: "成交日", render: (d) => d.closedAt || "—" },
          { key: "status", label: "状态", render: (d) => canWriteStudent(studentById(d.studentId)) ? (
            <TypeSelect aria-label="状态" options={[...DEAL_STAGES]} value={d.status} onChange={(v) => setDealStatus(d.id, v as DealStatus)} />
          ) : <StatusPill value={d.status} /> },
        ]} />
      ) : (
        <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActive(db.deals.find((d) => d.id === e.active.id) || null)} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            {BOARD_COLS.map((col) => (
              <Column key={col} id={col} title={col} count={board.filter((d) => d.status === col).length}>
                {board.filter((d) => d.status === col).map((d) => (
                  <Card key={d.id} deal={d} types={db.enums.dealTypes} draggable={canWriteStudent(studentById(d.studentId))} studentName={studentById(d.studentId)?.zhName || ""} ownerName={userById(d.ownerId)?.name || ""} onOpen={() => router.push("/students/" + d.studentId)} />
                ))}
              </Column>
            ))}
          </div>
          <DragOverlay>{active ? <div className="w-64 rounded-md border border-primary bg-surface p-3 text-sm shadow-lg">{active.name}</div> : null}</DragOverlay>
          <p className="mt-3 text-xs text-muted">拖拽只在潜在 ↔ 跟进之间；成交 / 失单 / 暂停请回列表行内改状态。同事的订单卡不可拖。</p>
        </DndContext>
      )}
    </div>
  );
}

function Column({ id, title, count, children }: { id: string; title: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("min-h-[220px] rounded-lg border border-border bg-slate-100/70 p-3 transition-colors", isOver && "border-primary bg-blue-50")}>
      <div className="mb-2 flex items-center justify-between text-sm"><StatusPill value={title} /><span className="text-muted">{count}</span></div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ deal, types, draggable, studentName, ownerName, onOpen }: { deal: Deal; types: string[]; draggable: boolean; studentName: string; ownerName: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id, disabled: !draggable });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("rounded-md border border-border bg-surface p-3 text-sm shadow-card", draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-80", isDragging && "opacity-30")}
    >
      <div className="flex items-start justify-between gap-2">
        <b className="leading-tight">{deal.name}</b>
        <button type="button" className="text-xs text-primary hover:underline" onPointerDown={(e) => e.stopPropagation()} onClick={onOpen}>360</button>
      </div>
      <div className="mt-1 text-xs text-muted">{studentName} · {ownerName}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs"><TypeChip value={deal.type} className="min-w-0" siblings={types} /><b>{money(deal.amount, deal.currency)}</b></div>
      {!draggable ? <div className="mt-1 text-[11px] text-muted">同事负责 · 只读</div> : null}
    </div>
  );
}
