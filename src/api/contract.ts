/**
 * API 契约占位：与开发规划 `apps/api` NestJS `/v1` 同形。
 * 演示阶段所有函数由 SessionContext 内存实现；正式接入时把这里换成 fetch(`${BASE}/v1/...`)。
 */
import type { Commission, Deal, DealStatus, HourEntry, Lead, Opportunity, Payment, Student, Task, User } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/v1";

export interface LoginReq { login: string; password: string; }
export interface LoginRes { token: string; user: User; }

export interface CrmApi {
  // D1 账号
  login(body: LoginReq): Promise<LoginRes>;
  // D3 学生：顾问全量可读，不按 advisorId 过滤
  listStudents(): Promise<Student[]>;
  patchStudent(id: string, patch: Partial<Student>): Promise<Student>;
  // D4 订单服务
  listDeals(): Promise<Deal[]>;
  transitionDeal(id: string, status: DealStatus): Promise<Deal>;
  // D5 课时
  reviewHour(id: string, body: { plannedHours: number }): Promise<HourEntry>;
  returnHour(id: string, body: { reason: string }): Promise<HourEntry>;
  // D6 收费佣金
  createPayment(body: Partial<Payment>): Promise<Payment>;
  transitionPayment(id: string, body: { to: Payment["status"]; reason?: string }): Promise<Payment>;
  listCommissions(scope: "me" | "all"): Promise<Commission[]>;
  // D7 任务
  createTask(body: Partial<Task>): Promise<Task>;
  // D8 续费线索
  createOpportunity(body: Partial<Opportunity>): Promise<Opportunity>;
  claimLead(id: string): Promise<Student>;
  // 公开
  publicTeacherLog(body: Partial<HourEntry>): Promise<void>;
  publicLead(body: Partial<Lead>): Promise<void>;
  publicPayment(body: Partial<Payment>): Promise<void>;
}

export const ROUTES = {
  login: "POST /v1/auth/login",
  students: "GET /v1/students",
  patchService: "PATCH /v1/services/:id",
  reviewHour: "POST /v1/hours/:id/review",
  payments: "POST /v1/payments",
  transitionPayment: "POST /v1/payments/:id/transition",
  commissions: "GET /v1/commissions?scope=me",
  publicTeachers: "GET /v1/public/teachers",
  publicTeacherLogs: "POST /v1/public/teacher-logs",
  publicLeads: "POST /v1/public/leads",
  publicPayments: "POST /v1/public/payments",
  publicPayToken: "POST /v1/public/pay/:token",
  claimLead: "POST /v1/leads/:id/claim",
  importExcel: "POST /v1/import",
  dashboard: "GET /v1/dashboard",
  auditLogs: "GET /v1/audit-logs",
} as const;
