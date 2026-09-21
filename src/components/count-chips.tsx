"use client";

import { cn } from "@/lib/utils";

export function CountChips({ items, active, onChange }: { items: { key: string; count: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={() => onChange(it.key)}
          className={cn(
            "min-w-[72px] rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors",
            active === it.key ? "border-primary bg-blue-50 text-primary" : "hover:border-slate-300"
          )}
        >
          <div className="text-xs">{it.key}</div>
          <div className="text-lg font-semibold leading-tight">{it.count}</div>
        </button>
      ))}
    </div>
  );
}
