"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FilterBar({ keyword, onKeyword, onReset, children }: { keyword: string; onKeyword: (v: string) => void; onReset: () => void; children?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Input type="search" placeholder="关键词" value={keyword} onChange={(e) => onKeyword(e.target.value)} className="min-w-[160px] flex-1 sm:max-w-xs" aria-label="关键词" />
      {children}
      <Button onClick={onReset}>重置</Button>
    </div>
  );
}
