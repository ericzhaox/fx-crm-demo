"use client";

import { cn } from "@/lib/utils";

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm text-muted transition-colors",
            value === t ? "border-primary font-semibold text-primary" : "border-transparent hover:text-text"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn("rounded px-3 py-1 text-sm", value === o ? "bg-primary text-white" : "text-muted hover:text-text")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
