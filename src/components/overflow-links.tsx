"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { typeStyle } from "@/components/type-chip";
import { cn } from "@/lib/utils";

export type OverflowItem = { id: string; name: string; type?: string };

function LinkChip({ item, className, siblings }: { item: OverflowItem; className?: string; siblings?: string[] }) {
  const s = typeStyle(item.type, siblings);
  return (
    <span className={cn("inline-flex max-w-[148px] items-stretch overflow-hidden rounded-sm bg-slate-50", className)}>
      <span className="w-[3px] shrink-0" style={{ backgroundColor: s?.bg || "var(--label-other)" }} />
      <span className="truncate px-1.5 py-0.5 text-xs text-text">{item.name}</span>
    </span>
  );
}

export function OverflowLinks({ items, siblings }: { items: OverflowItem[]; siblings?: string[] }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const place = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, place]);

  if (!items.length) return <span className="text-muted">—</span>;
  const rest = items.length - 1;

  return (
    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <LinkChip item={items[0]} siblings={siblings} />
      {rest > 0 ? (
        <>
          <button
            ref={btnRef}
            type="button"
            aria-expanded={open}
            aria-label={`还有 ${rest} 项`}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold leading-none text-white"
            onClick={() => { place(); setOpen((o) => !o); }}
          >
            +{rest}
          </button>
          {open
            ? createPortal(
                <div
                  ref={panelRef}
                  role="listbox"
                  className="z-[60] min-w-[180px] rounded-md border border-border bg-surface p-1.5 shadow-lg"
                  style={{ position: "fixed", top: pos.top, left: pos.left }}
                >
                  {items.map((it) => (
                    <div key={it.id} className="px-0.5 py-0.5">
                      <LinkChip item={it} className="max-w-[240px]" siblings={siblings} />
                    </div>
                  ))}
                </div>,
                document.body
              )
            : null}
        </>
      ) : null}
    </div>
  );
}
