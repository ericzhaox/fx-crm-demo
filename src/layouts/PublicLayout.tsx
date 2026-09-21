import * as React from "react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 text-xs uppercase tracking-[0.1em] text-muted">FX International</div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">{children}</div>
      </div>
    </div>
  );
}
