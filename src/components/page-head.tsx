import * as React from "react";

export function PageHead({ title, desc, extra }: { title: string; desc?: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
        {desc ? <p className="mt-1 text-sm text-muted">{desc}</p> : null}
      </div>
      {extra ? <div className="flex flex-wrap items-center gap-2">{extra}</div> : null}
    </div>
  );
}
