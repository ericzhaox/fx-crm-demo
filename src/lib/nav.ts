import type { Role } from "@/api/types";

export interface NavItem { path: string; label: string; roles: Role[]; }
export interface NavGroup { group: string; items: NavItem[]; }

export const NAV: NavGroup[] = [
  { group: "每日", items: [
    { path: "/home", label: "工作台", roles: ["advisor", "owner"] },
    { path: "/dashboard", label: "经营看板", roles: ["advisor", "owner", "finance"] },
  ] },
  { group: "学生管理", items: [
    { path: "/students", label: "学生", roles: ["advisor", "owner"] },
    { path: "/deals", label: "订单", roles: ["advisor", "owner"] },
    { path: "/services", label: "服务", roles: ["advisor", "owner"] },
    { path: "/renewals", label: "续费/二销", roles: ["advisor", "owner"] },
    { path: "/leads", label: "合作方线索", roles: ["advisor", "owner"] },
  ] },
  { group: "交付", items: [
    { path: "/tasks", label: "顾问任务", roles: ["advisor", "owner"] },
    { path: "/hours", label: "课时审核", roles: ["advisor", "owner"] },
    { path: "/settlements/teachers", label: "老师课时结算", roles: ["owner", "finance"] },
  ] },
  { group: "财务", items: [
    { path: "/payments", label: "收费登记", roles: ["advisor", "owner", "finance"] },
    { path: "/commissions", label: "佣金", roles: ["advisor", "owner", "finance"] },
  ] },
  { group: "设置", items: [
    { path: "/settings/users", label: "账号与角色", roles: ["owner"] },
    { path: "/settings/teachers", label: "老师", roles: ["owner"] },
    { path: "/settings/partners", label: "合作方", roles: ["owner"] },
    { path: "/settings/enums", label: "业务枚举", roles: ["owner"] },
    { path: "/settings/import", label: "Excel 导入", roles: ["owner"] },
    { path: "/settings/audit", label: "操作日志", roles: ["advisor", "owner", "finance"] },
  ] },
];

export function allowedPaths(role: Role): string[] {
  return NAV.flatMap((g) => g.items.filter((i) => i.roles.includes(role)).map((i) => i.path));
}

export function homeFor(role: Role) {
  return role === "finance" ? "/dashboard" : "/home";
}

export const ROLE_LABEL: Record<Role, string> = { advisor: "顾问", owner: "老板", finance: "财务" };
