"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

const PAGE_SIZES = [10, 20, 50];

export function DataTable<T extends { id: string }>({ columns, rows, onRow, empty }: { columns: Column<T>[]; rows: T[]; onRow?: (row: T) => void; empty?: React.ReactNode }) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const rowKey = rows.map((r) => r.id).join();
  React.useEffect(() => { setPage(1); }, [rowKey, pageSize]);

  if (!rows.length) {
    return <EmptyState>{empty || "暂无数据，可调整筛选或新建。"}</EmptyState>;
  }

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageSafe = Math.min(page, pages);
  const slice = rows.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const showPager = rows.length > 10;

  return (
    <div>
      <div className="overflow-auto rounded-lg border border-border bg-surface shadow-card">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("sticky top-0 whitespace-nowrap bg-slate-50 px-3 py-2 text-left font-semibold text-muted", c.className)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={row.id}
                className={cn("border-t border-border even:bg-slate-50", onRow && "cursor-pointer hover:bg-blue-50/60")}
                onClick={() => onRow?.(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-3 py-2 align-middle", c.className)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPager ? (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 text-sm text-muted">
          <span>共 {rows.length} 条</span>
          <Select
            aria-label="每页条数"
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="py-1 text-sm"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}条/页</option>)}
          </Select>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="上一页" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                size="sm"
                variant={n === pageSafe ? "primary" : "ghost"}
                aria-current={n === pageSafe ? "page" : undefined}
                onClick={() => setPage(n)}
                className="min-w-8"
              >
                {n}
              </Button>
            ))}
            <Button size="sm" variant="ghost" aria-label="下一页" disabled={pageSafe >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">{children}</div>;
}
