import * as React from "react";
import { cn } from "@/lib/utils";

export type Tone = "gray" | "blue" | "green" | "amber" | "red";

const tones: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-primary",
  green: "bg-[var(--color-success-bg)] text-success",
  amber: "bg-[var(--color-warning-bg)] text-warning",
  red: "bg-[var(--color-danger-bg)] text-danger",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
