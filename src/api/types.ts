export type Role = "advisor" | "owner" | "finance";
export type Currency = "CNY" | "CAD";
export type DealStatus = "潜在" | "跟进" | "成交" | "失单" | "暂停";
export type PayStatus = "已登记" | "待确认" | "未付款" | "已付款" | "退回";
export type HourStatus = "已提交" | "已通过" | "退回";
export type Attendance = "正常" | "迟到" | "缺席" | "请假" | "早退" | "其他";

export const DEAL_STAGES: DealStatus[] = ["潜在", "跟进", "成交", "失单", "暂停"];
export const PAY_FLOW: PayStatus[] = ["已登记", "待确认", "未付款", "已付款"];
export const ATTENDANCE: Attendance[] = ["正常", "迟到", "缺席", "请假", "早退", "其他"];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  supervisorId?: string;
  status: "active" | "inactive";
}

export interface Student {
  id: string;
  fxId: string;
  zhName: string;
  enName: string;
  grade: string;
  school: string;
  parentName: string;
  mobile: string;
  email: string;
  wechat: string;
  advisorId: string;
  status: "Active" | "暂停" | "Alumni" | "Lost";
  source: string;
  partnerId?: string;
  firstDealDate?: string;
  offerExpires?: string;
  visaExpires?: string;
}

export interface Teacher { id: string; zhName: string; enName: string; status: "active" | "inactive"; phone?: string; }
export interface Partner {
  id: string;
  name: string;
  type: "单位" | "个人";
  status: "active" | "inactive";
  contact?: string;
  phone?: string;
  email?: string;
}

export interface Deal {
  id: string;
  studentId: string;
  name: string;
  type: string;
  amount: number;
  currency: Currency;
  ownerId: string;
  status: DealStatus;
  partnerId?: string;
  closedAt?: string;
}

export interface Service {
  id: string;
  studentId: string;
  dealId?: string;
  name: string;
  type: string;
  advisorId: string;
  teacherId: string;
  start: string;
  end: string;
  totalHours: number;
  completedHours: number;
  status: "进行中" | "已完成" | "暂停";
}

export interface Task {
  id: string;
  title: string;
  studentId: string;
  assigneeId: string;
  deadline: string;
  priority: "高" | "中" | "低";
  status: "待开始" | "进行中" | "已完成";
  type: string;
  note?: string;
}

export interface Opportunity {
  id: string;
  studentId: string;
  serviceId?: string;
  dealId?: string;
  type: "续费" | "二销";
  rec: string;
  expireOn: string;
  amount: number;
  currency: Currency;
  advisorId: string;
  status: "新机会" | "跟进" | "关闭";
  openedAt: string;
  nextAction?: string;
  followup?: string;
  handled: boolean;
  escalated?: boolean;
}

export interface Lead {
  id: string;
  zhName: string;
  enName?: string;
  startOn?: string;
  partnerName: string;
  partnerId?: string;
  contact?: string;
  phone?: string;
  email?: string;
  grade?: string;
  school?: string;
  parent?: string;
  parentPhone?: string;
  wechat?: string;
  intent?: string;
  note?: string;
  followerId?: string;
  status?: string;
}

export interface HourEntry {
  id: string;
  title: string;
  teacherId: string;
  studentId: string;
  serviceId?: string;
  subject: string;
  attendance: Attendance;
  date: string;
  start: string;
  hours: number;
  planned: number;
  summary?: string;
  performance?: number;
  attachmentName?: string;
  homeworkNote?: string;
  status: HourStatus;
  initiator: "teacher" | "advisor";
  returnReason?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  dealId?: string;
  filerType: "顾问" | "合作方";
  filerUserId?: string;
  filerPartnerId?: string;
  amount: number;
  currency: Currency;
  voucher: string;
  note?: string;
  status: PayStatus;
  createdAt: string;
}

export interface Commission {
  id: string;
  paymentId: string;
  filerType: "顾问" | "合作方";
  filerUserId?: string;
  filerPartnerId?: string;
  received: number;
  refund: number;
  rate: number;
  paidOut: number;
}

export interface Audit {
  id: string;
  type: string;
  actorId: string;
  at: string;
  content: string;
  result: string;
}

export interface PayToken { id: string; studentId: string; partnerId?: string; expired: boolean; }
export interface Enums { dealTypes: string[]; taskTypes: string[]; }
export interface ReminderAck { key: string; userId: string; }

export interface Db {
  users: User[];
  teachers: Teacher[];
  partners: Partner[];
  enums: Enums;
  students: Student[];
  services: Service[];
  deals: Deal[];
  hours: HourEntry[];
  payments: Payment[];
  commissions: Commission[];
  tasks: Task[];
  opportunities: Opportunity[];
  leads: Lead[];
  audits: Audit[];
  payTokens: PayToken[];
  reminderAcks: ReminderAck[];
}
