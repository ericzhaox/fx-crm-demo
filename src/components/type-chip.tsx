"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabelStyle { bg: string; dark?: boolean; }

const C = {
  blue: { bg: "var(--label-guardian)" },
  purple: { bg: "var(--label-transfer)" },
  orange: { bg: "var(--label-afterschool)" },
  greenDeep: { bg: "var(--label-credit)" },
  navy: { bg: "var(--label-university)" },
  pinkHot: { bg: "var(--label-activity)" },
  yellow: { bg: "var(--label-camp)", dark: true },
  pink: { bg: "var(--label-private)" },
  brown: { bg: "var(--label-visa)" },
  gray: { bg: "var(--label-other)" },
  green: { bg: "var(--label-done)" },
  red: { bg: "var(--label-stuck)" },
} as const satisfies Record<string, LabelStyle>;

/** 业务类型 + 状态/出勤/优先级等固定色；同名恒同色。 */
const FIXED: Record<string, LabelStyle> = {
  "监护": C.blue,
  "转学": C.purple,
  "After-school": C.orange,
  "学分课": C.greenDeep,
  "大学申请": C.navy,
  "活动": C.pinkHot,
  "夏令营": C.yellow,
  "私校申请": C.pink,
  "签证": C.brown,
  "其他": C.gray,

  "成交": C.green, "已付款": C.green, "已通过": C.green, "已完成": C.green, "完成": C.green, "已处理": C.green,
  Active: C.green, active: C.green, "低": C.green, "正常": C.green,

  "跟进": C.blue, "进行中": C.blue, "待确认": C.blue, "跟进中": C.blue,
  "新机会": C.yellow,

  "未付款": C.orange, "已提交": C.orange, "中": C.orange, "迟到": C.orange, "卡住": C.orange,
  "早退": C.navy,

  "失单": C.red, Lost: C.red, "高": C.red, "退回": C.red, "缺席": C.red,

  "潜在": C.gray, Alumni: C.gray, "已登记": C.gray, "待开始": C.gray, "关闭": C.gray, "未处理": C.gray, inactive: C.gray,
  "暂停": C.brown,

  "请假": C.purple, "续费": C.purple,
  "二销": C.pink,
};

/** 新枚举按名称哈希落到调色板；组内跳过 siblings 已占用色。 */
const PALETTE: LabelStyle[] = [C.blue, C.purple, C.orange, C.greenDeep, C.navy, C.pinkHot, C.yellow, C.pink, C.brown, C.green, C.red];

function hashIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

function pickUnused(name: string, used: Set<string>): LabelStyle {
  const start = hashIndex(name);
  for (let i = 0; i < PALETTE.length; i++) {
    const s = PALETTE[(start + i) % PALETTE.length];
    if (!used.has(s.bg)) return s;
  }
  return PALETTE[start];
}

export function typeStyle(value?: string, siblings?: string[]): LabelStyle | null {
  if (!value) return null;
  if (!siblings?.length) return FIXED[value] ?? pickUnused(value, new Set());
  const assigned = new Map<string, LabelStyle>();
  for (const s of siblings) {
    if (FIXED[s]) assigned.set(s, FIXED[s]);
  }
  for (const s of siblings) {
    if (assigned.has(s)) continue;
    assigned.set(s, pickUnused(s, new Set([...assigned.values()].map((x) => x.bg))));
  }
  if (!assigned.has(value)) {
    assigned.set(value, FIXED[value] ?? pickUnused(value, new Set([...assigned.values()].map((x) => x.bg))));
  }
  return assigned.get(value) ?? null;
}

export function TypeChip({ value, className, siblings }: { value?: string; className?: string; siblings?: string[] }) {
  const s = typeStyle(value, siblings);
  if (!s) return <span className="text-muted">—</span>;
  return (
    <span
      className={cn("inline-flex min-w-[72px] items-center justify-center rounded px-2 py-0.5 text-xs font-semibold leading-5", className)}
      style={{ backgroundColor: s.bg, color: s.dark ? "#1f2937" : "#fff" }}
    >
      {value}
    </span>
  );
}

export function TypeSelect({
  name,
  options,
  defaultValue,
  value: valueProp,
  onChange,
  className,
  "aria-label": ariaLabel = "选项",
  disabled,
}: {
  name?: string;
  options: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const first = options[0] || "";
  const controlled = valueProp !== undefined;
  const [inner, setInner] = React.useState(defaultValue || first);
  const value = controlled ? valueProp : inner;
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (controlled) return;
    if (!options.includes(inner)) setInner(options[0] || "");
  }, [options, inner, controlled]);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(t: string) {
    if (!controlled) setInner(t);
    onChange?.(t);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-muted"
      >
        <TypeChip value={value} className="min-w-0" siblings={options} />
        <ChevronDown size={14} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && !disabled ? (
        <ul
          role="listbox"
          className="mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-surface p-1 shadow-lg"
        >
          {options.map((t) => (
            <li key={t} role="option" aria-selected={t === value}>
              <button
                type="button"
                className={cn("flex w-full items-center rounded px-1 py-1 hover:bg-slate-50", t === value && "bg-slate-50")}
                onClick={() => pick(t)}
              >
                <TypeChip value={t} siblings={options} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
