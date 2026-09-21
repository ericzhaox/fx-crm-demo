"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { useCRM } from "@/context/SessionContext";
import { NAV, allowedPaths, homeFor, ROLE_LABEL } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { TODAY } from "@/mock/seed";
import { EmptyState } from "@/components/data-table";
import { Button } from "@/components/ui/button";

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated, logout, resetDemo } = useCRM();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const navRef = React.useRef<HTMLElement | null>(null);
  const fitPending = React.useRef(true);

  const groups = React.useMemo(
    () => (user ? NAV.map((g) => ({ group: g.group, items: g.items.filter((i) => i.roles.includes(user.role)) })).filter((g) => g.items.length) : []),
    [user]
  );
  const groupHasActive = React.useCallback(
    (g: { items: { path: string }[] }) => g.items.some((it) => pathname === it.path || (it.path === "/students" && pathname.startsWith("/students/"))),
    [pathname]
  );

  // 自动适配：进入或窗口缩放时若菜单装不下，从底部起折叠不含当前页的组，直到放得下。
  // 用户手动展开后不再自动回收；仍装不下时靠隐藏滚动条的滑动兜底。
  React.useEffect(() => {
    const onResize = () => { fitPending.current = true; setCollapsedGroups((s) => ({ ...s })); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  React.useEffect(() => {
    if (!fitPending.current) return;
    const nav = navRef.current;
    if (!nav) return;
    if (nav.scrollHeight <= nav.clientHeight + 1) { fitPending.current = false; return; }
    const candidate = [...groups].reverse().find((g) => !collapsedGroups[g.group] && !groupHasActive(g));
    if (!candidate) { fitPending.current = false; return; }
    setCollapsedGroups((s) => ({ ...s, [candidate.group]: true }));
  }, [collapsedGroups, groups, groupHasActive]);

  const blocked = React.useMemo(() => {
    if (!user) return false;
    if (pathname.startsWith("/students/")) return user.role === "finance";
    return !allowedPaths(user.role).includes(pathname);
  }, [user, pathname]);

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  React.useEffect(() => {
    if (user && blocked) toast.error("当前角色无权访问此页");
  }, [user, blocked, pathname]);

  if (!hydrated || !user) return <div className="grid min-h-screen place-items-center text-sm text-muted">{hydrated ? "正在跳转登录…" : "加载中…"}</div>;

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-slate-200/80 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 pb-2 pt-4">
          <div className="font-display text-[17px] font-semibold tracking-tight text-white">FX International CRM</div>
          <div className="mt-1 text-xs text-slate-400">{user.name} · {ROLE_LABEL[user.role]}</div>
        </div>
        <nav ref={navRef} className="scrollbar-none flex-1 overflow-y-auto pb-2">
          {groups.map((g) => {
            const collapsed = !!collapsedGroups[g.group];
            const hasActive = groupHasActive(g);
            return (
              <div key={g.group}>
                <button
                  type="button"
                  onClick={() => { fitPending.current = false; setCollapsedGroups((s) => ({ ...s, [g.group]: !s[g.group] })); }}
                  aria-expanded={!collapsed}
                  className="flex w-full items-center justify-between px-4 pb-1 pt-2.5 text-[11px] uppercase tracking-[0.08em] text-slate-400 hover:text-white"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {g.group}
                    {collapsed && hasActive ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="当前页在此组" /> : null}
                  </span>
                  <ChevronDown size={14} className={cn("transition-transform", collapsed && "-rotate-90")} />
                </button>
                {!collapsed ? g.items.map((it) => {
                  const active = pathname === it.path || (it.path === "/students" && pathname.startsWith("/students/"));
                  return (
                    <Link
                      key={it.path}
                      href={it.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "mx-2 my-0.5 block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-2 hover:text-white",
                        active && "bg-primary text-white hover:bg-primary"
                      )}
                    >
                      {it.label}
                    </Link>
                  );
                }) : null}
              </div>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/10 px-4 py-3 text-xs text-slate-400">
          <div>演示数据 · {TODAY}</div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => { logout(); router.push("/login"); }} className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-white hover:bg-white/10">
              <LogOut size={12} /> 退出
            </button>
            <button type="button" onClick={resetDemo} className="rounded-md border border-white/20 px-2 py-1 text-white hover:bg-white/10">还原数据</button>
          </div>
        </div>
      </aside>
      {open ? <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setOpen(false)} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur md:px-6">
          <button type="button" className="rounded-md p-1.5 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="菜单">
            <Menu size={20} />
          </button>
          <span className="hidden text-sm text-muted md:inline">FX International · 内部 CRM</span>
          <span className="text-sm text-muted">{user.email}</span>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {blocked ? (
            <EmptyState>
              当前角色不能打开此页。
              <div className="mt-4">
                <Button variant="primary" onClick={() => router.push(homeFor(user.role))}>返回首页</Button>
              </div>
            </EmptyState>
          ) : children}
        </main>
      </div>
    </div>
  );
}
