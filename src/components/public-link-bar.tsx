"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withBase } from "@/lib/utils";

export interface PublicLink { label: string; path: string; note?: string; }

export function PublicLinkBar({ links, title = "免登录公开链接" }: { links: PublicLink[]; title?: string }) {
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => { setOrigin(window.location.origin); }, []);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败，请手动选择地址");
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
      <div className="mb-2 text-xs font-medium text-primary">{title} · 发给对方即可填报，对方无账号、进不了 CRM</div>
      <ul className="space-y-1.5">
        {links.map((l) => {
          const url = origin + withBase(l.path);
          return (
            <li key={l.path} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-[96px] font-medium">{l.label}</span>
              <code className="rounded bg-white px-1.5 py-0.5 text-xs text-muted">{origin ? url : l.path}</code>
              {l.note ? <span className="text-xs text-muted">{l.note}</span> : null}
              <span className="ml-auto flex gap-1">
                <Button size="sm" onClick={() => copy(url)}><Copy size={12} /> 复制</Button>
                <Button size="sm" onClick={() => window.open(withBase(l.path), "_blank", "noopener")}><ExternalLink size={12} /> 打开</Button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
