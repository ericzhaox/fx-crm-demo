"use client";

import { TypeChip } from "@/components/type-chip";

export function StatusPill({ value, siblings }: { value?: string; siblings?: string[] }) {
  return <TypeChip value={value} siblings={siblings} />;
}
