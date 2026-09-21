"use client";

import * as React from "react";
import { toast } from "sonner";
import { seed, TODAY } from "@/mock/seed";
import type {
  Commission, Db, Deal, DealStatus, Enums, HourEntry, Lead, Opportunity, Partner,
  Payment, Service, Student, Task, Teacher, User,
} from "@/api/types";
import { PAY_FLOW } from "@/api/types";

interface Store {
  db: Db;
  user: User | null;
  hydrated: boolean;
  resetDemo: () => void;
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  logout: () => void;
  userById: (id?: string) => User | undefined;
  studentById: (id?: string) => Student | undefined;
  teacherById: (id?: string) => Teacher | undefined;
  partnerById: (id?: string) => Partner | undefined;
  remain: (sv: Service) => number;
  clv: (studentId: string, currency?: string) => number;
  nextRenew: (studentId: string) => string;
  daysUntil: (date?: string) => number;
  canWriteStudent: (student?: Student) => boolean;
  isFinanceOrOwner: boolean;
  formula: (c: Commission) => { net: number; due: number; wait: number; after: number };
  visiblePayments: Payment[];
  visibleCommissions: Commission[];
  setDealStatus: (id: string, status: DealStatus) => void;
  addDeal: (row: Partial<Deal>) => void;
  addService: (row: Partial<Service>) => void;
  advancePay: (id: string) => void;
  returnPay: (id: string, reason: string) => void;
  confirmPayAmount: (id: string, amount: number) => void;
  updateCommission: (id: string, patch: Partial<Commission>) => void;
  reviewHour: (id: string, planned: number) => void;
  returnHour: (id: string, reason: string) => void;
  addHourAdvisor: (row: Partial<HourEntry>) => void;
  addPayment: (row: Partial<Payment>) => void;
  addTask: (row: Partial<Task>) => void;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  addOpportunity: (row: Partial<Opportunity>) => void;
  touchOpp: (id: string, patch: Partial<Opportunity>) => void;
  runRenewalJob: () => void;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addStudent: (row: Partial<Student>) => void;
  claimLead: (id: string) => void;
  assignLead: (id: string, advisorId: string) => void;
  ackReminder: (key: string) => void;
  issueToken: (studentId: string) => string | null;
  publicHour: (row: Partial<HourEntry>) => void;
  publicLead: (row: Partial<Lead>) => void;
  publicPay: (row: Partial<Payment>) => void;
  addUser: (row: Partial<User>) => void;
  handover: (fromId: string, toId: string) => void;
  addTeacher: (row: Partial<Teacher>) => void;
  toggleTeacher: (id: string) => void;
  patchTeacher: (id: string, patch: Partial<Teacher>) => void;
  addPartner: (row: Partial<Partner>) => void;
  togglePartner: (id: string) => void;
  patchPartner: (id: string, patch: Partial<Partner>) => void;
  addEnum: (group: keyof Enums, val: string) => void;
  fakeImport: () => void;
}

const Ctx = React.createContext<Store | null>(null);

export function useCRM() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useCRM must be used within SessionProvider");
  return ctx;
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function stamp() {
  return TODAY + " " + new Date().toTimeString().slice(0, 5);
}

const KEY_DB = "fx-crm-demo-db-v1";
const KEY_USER = "fx-crm-demo-user-v1";

function readStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<Db>(() => clone(seed));
  const [user, setUser] = React.useState<User | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const userRef = React.useRef<User | null>(null);
  userRef.current = user;

  React.useEffect(() => {
    const storedDb = readStored<Db>(KEY_DB);
    const storedUser = readStored<User>(KEY_USER);
    if (storedDb) setDb(storedDb);
    if (storedUser) setUser(storedUser);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(KEY_DB, JSON.stringify(db));
      if (user) window.sessionStorage.setItem(KEY_USER, JSON.stringify(user));
      else window.sessionStorage.removeItem(KEY_USER);
    } catch { /* ignore quota */ }
  }, [db, user, hydrated]);

  const mutate = React.useCallback((fn: (d: Db) => void) => {
    setDb((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
  }, []);

  const auditIn = (d: Db, type: string, content: string, actorId?: string) => {
    d.audits.unshift({ id: "a" + Date.now() + Math.random().toString(36).slice(2, 5), type, actorId: actorId ?? userRef.current?.id ?? "", at: stamp(), content, result: "成功" });
  };

  const userById = (id?: string) => db.users.find((u) => u.id === id);
  const studentById = (id?: string) => db.students.find((s) => s.id === id);
  const teacherById = (id?: string) => db.teachers.find((t) => t.id === id);
  const partnerById = (id?: string) => db.partners.find((p) => p.id === id);
  const remain = (sv: Service) => Math.max(0, sv.totalHours - sv.completedHours);
  const clv = (studentId: string, currency?: string) =>
    db.payments.filter((p) => p.studentId === studentId && p.status === "已付款" && (!currency || p.currency === currency)).reduce((s, p) => s + p.amount, 0);
  const nextRenew = (studentId: string) => {
    const list = db.services.filter((s) => s.studentId === studentId && s.status === "进行中");
    return list.length ? list.map((s) => s.end).sort()[0] : "";
  };
  const daysUntil = (date?: string) => (date ? Math.round((new Date(date).getTime() - new Date(TODAY).getTime()) / 86400000) : 9999);
  const canWriteStudent = (student?: Student) => {
    if (!user || !student) return false;
    if (user.role === "owner") return true;
    return user.role === "advisor" && student.advisorId === user.id;
  };
  const isFinanceOrOwner = !!user && (user.role === "owner" || user.role === "finance");
  const formula = (c: Commission) => {
    const net = c.received - c.refund;
    const due = Math.round(net * c.rate) / 100;
    const wait = Math.round((due - c.paidOut) * 100) / 100;
    return { net, due, wait, after: Math.round((net - due) * 100) / 100 };
  };

  const visiblePayments = React.useMemo(() => {
    if (!user) return [];
    if (user.role !== "advisor") return db.payments;
    return db.payments.filter((p) => {
      const st = db.students.find((s) => s.id === p.studentId);
      return (st && st.advisorId === user.id) || p.filerUserId === user.id;
    });
  }, [db.payments, db.students, user]);

  const visibleCommissions = React.useMemo(() => {
    if (!user) return [];
    if (user.role !== "advisor") return db.commissions;
    return db.commissions.filter((c) => c.filerUserId === user.id);
  }, [db.commissions, user]);

  const login: Store["login"] = (email, password) => {
    if (password !== "demo") return { ok: false, error: "密码错误" };
    const u = db.users.find((x) => x.email === email && x.status === "active");
    if (!u) return { ok: false, error: "账号不存在或已停用" };
    setUser(u);
    mutate((d) => auditIn(d, "登录", u.name + "登录", u.id));
    return { ok: true, user: u };
  };

  const logout = () => {
    const u = userRef.current;
    if (u) mutate((d) => auditIn(d, "登出", u.name + "登出", u.id));
    setUser(null);
  };

  const buildStudentFromLead = (d: Db, ld: Lead, advisorId: string): Student => ({
    id: "st" + Date.now(),
    fxId: "FX" + String(d.students.length + 1).padStart(4, "0"),
    zhName: ld.zhName, enName: ld.enName || ld.zhName, grade: ld.grade || "", school: ld.school || "",
    parentName: ld.parent || "", mobile: ld.parentPhone || ld.phone || "", email: ld.email || "", wechat: ld.wechat || "",
    advisorId, status: "Active", source: "合作方线索", partnerId: ld.partnerId,
  });

  const resetDemo = () => {
    setDb(clone(seed));
    toast.success("演示数据已还原");
  };

  const store: Store = {
    db, user, hydrated, resetDemo, login, logout, userById, studentById, teacherById, partnerById,
    remain, clv, nextRenew, daysUntil, canWriteStudent, isFinanceOrOwner, formula,
    visiblePayments, visibleCommissions,

    setDealStatus(id, status) {
      const deal = db.deals.find((x) => x.id === id);
      if (!canWriteStudent(studentById(deal?.studentId))) { toast.error("只能改自己负责学生的订单"); return; }
      mutate((d) => {
        const x = d.deals.find((y) => y.id === id);
        if (x) { x.status = status; if (status === "成交") x.closedAt = TODAY; }
        auditIn(d, "修改", `订单 ${deal?.name} → ${status}`);
      });
    },
    addDeal(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己负责的学生建订单"); return; }
      mutate((d) => {
        d.deals.unshift({ id: "d" + Date.now(), ownerId: user!.id, status: "潜在", ...row } as Deal);
        auditIn(d, "新增", `订单 ${row.name}`);
      });
      toast.success("订单已建");
    },
    addService(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己负责的学生建服务"); return; }
      mutate((d) => {
        d.services.unshift({ id: "sv" + Date.now(), advisorId: user!.id, completedHours: 0, status: "进行中", ...row } as Service);
        auditIn(d, "新增", `服务 ${row.name}`);
      });
      toast.success("服务已建");
    },
    advancePay(id) {
      if (!isFinanceOrOwner) { toast.error("顾问不能推进收费状态"); return; }
      const p = db.payments.find((x) => x.id === id);
      const i = p ? PAY_FLOW.indexOf(p.status) : -1;
      if (!p || i < 0 || i >= PAY_FLOW.length - 1) { toast.error("不能再推进"); return; }
      mutate((d) => {
        const x = d.payments.find((y) => y.id === id);
        if (x) x.status = PAY_FLOW[i + 1];
        auditIn(d, "审核", `收费 ${id} → ${PAY_FLOW[i + 1]}`);
      });
    },
    returnPay(id, reason) {
      if (!isFinanceOrOwner) { toast.error("无权限退回"); return; }
      const p = db.payments.find((x) => x.id === id);
      if (!p || p.status === "未付款" || p.status === "已付款") { toast.error("未付款/已付款不可退回"); return; }
      mutate((d) => {
        const x = d.payments.find((y) => y.id === id);
        if (x) { x.status = "退回"; x.note = reason; }
        d.payTokens.forEach((t) => { if (t.studentId === p.studentId && p.filerType === "合作方") t.expired = true; });
        auditIn(d, "审核", `退回收费 ${id}`);
      });
    },
    confirmPayAmount(id, amount) {
      if (!isFinanceOrOwner) { toast.error("仅财务可改待确认金额"); return; }
      const p = db.payments.find((x) => x.id === id);
      if (p?.status !== "待确认") { toast.error("仅待确认可改金额"); return; }
      mutate((d) => {
        const x = d.payments.find((y) => y.id === id);
        if (x) x.amount = amount;
        const c = d.commissions.find((y) => y.paymentId === id);
        if (c) c.received = amount;
        auditIn(d, "修改", `待确认改金额 ${id} → ${amount}`);
      });
    },
    updateCommission(id, patch) {
      if (!isFinanceOrOwner) { toast.error("仅财务可改佣金数字"); return; }
      mutate((d) => {
        const c = d.commissions.find((x) => x.id === id);
        if (c) Object.assign(c, patch);
        auditIn(d, "修改", `改佣金 ${id}`);
      });
    },
    reviewHour(id, planned) {
      const h = db.hours.find((x) => x.id === id);
      if (!h) return;
      const st = studentById(h.studentId);
      if (h.initiator === "advisor" && user?.role !== "owner") { toast.error("顾问代填的课时只能老板审"); return; }
      if (h.initiator === "teacher" && user?.role === "advisor" && st?.advisorId !== user.id) { toast.error("只能审自己学生的老师课时"); return; }
      mutate((d) => {
        const x = d.hours.find((y) => y.id === id);
        if (x) { x.status = "已通过"; x.planned = planned; }
        const sv = d.services.find((s) => s.id === h.serviceId);
        if (sv) sv.completedHours += planned;
        auditIn(d, "审核", `通过课时 ${h.title} 拟计入 ${planned}`);
      });
      toast.success(`已通过，计入 ${planned} 小时`);
    },
    returnHour(id, reason) {
      mutate((d) => {
        const x = d.hours.find((y) => y.id === id);
        if (x) { x.status = "退回"; x.returnReason = reason; }
        auditIn(d, "审核", `退回课时 ${id}`);
      });
    },
    addHourAdvisor(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己学生补课时"); return; }
      const planned = row.attendance === "请假" || row.attendance === "缺席" ? 0 : row.hours || 0;
      mutate((d) => {
        d.hours.unshift({ id: "h" + Date.now(), status: "已提交", initiator: "advisor", planned, ...row } as HourEntry);
        auditIn(d, "新增", `顾问补课时 ${row.title}`);
      });
      toast.success("已提交，待老板审核");
    },
    addPayment(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己的学生登记收费"); return; }
      const id = "pay" + Date.now();
      mutate((d) => {
        d.payments.unshift({ id, status: "已登记", createdAt: TODAY, filerType: "顾问", filerUserId: user!.id, voucher: "demo.png", ...row } as Payment);
        d.commissions.unshift({ id: "c" + Date.now(), paymentId: id, filerType: "顾问", filerUserId: user!.id, received: row.amount || 0, refund: 0, rate: 10, paidOut: 0 });
        auditIn(d, "新增", `收费登记 ${row.amount} ${row.currency}`);
      });
      toast.success("已登记，佣金行已生成");
    },
    addTask(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己负责的学生建任务"); return; }
      mutate((d) => {
        d.tasks.unshift({ id: "tk" + Date.now(), assigneeId: user!.id, status: "待开始", priority: "中", ...row } as Task);
        auditIn(d, "新增", `任务 ${row.title}`);
      });
      toast.success("任务已建");
    },
    setTaskStatus(id, status) {
      const t = db.tasks.find((x) => x.id === id);
      if (!t) return;
      if (user?.role !== "owner" && t.assigneeId !== user?.id) { toast.error("不能改他人任务"); return; }
      mutate((d) => {
        const x = d.tasks.find((y) => y.id === id);
        if (x) x.status = status;
        auditIn(d, "修改", `任务 ${t.title} → ${status}`);
      });
    },
    addOpportunity(row) {
      if (!canWriteStudent(studentById(row.studentId))) { toast.error("只能给自己学生建机会"); return; }
      mutate((d) => {
        d.opportunities.unshift({ id: "op" + Date.now(), advisorId: user!.id, status: "新机会", openedAt: TODAY, handled: false, ...row } as Opportunity);
        auditIn(d, "新增", `手工机会 ${row.rec}`);
      });
      toast.success("机会已建");
    },
    touchOpp(id, patch) {
      const o = db.opportunities.find((x) => x.id === id);
      if (!canWriteStudent(studentById(o?.studentId))) { toast.error("只能跟进自己学生的机会"); return; }
      mutate((d) => {
        const x = d.opportunities.find((y) => y.id === id);
        if (x) { Object.assign(x, patch); x.handled = true; }
        auditIn(d, "修改", `跟进续费机会 ${id}`);
      });
      toast.success("已记为已处理");
    },
    runRenewalJob() {
      let added = 0;
      mutate((d) => {
        d.services.forEach((sv) => {
          if (sv.status !== "进行中" || daysUntil(sv.end) > 90) return;
          if (d.opportunities.some((o) => o.serviceId === sv.id && o.status !== "关闭")) return;
          d.opportunities.unshift({ id: "op" + Date.now() + sv.id, studentId: sv.studentId, serviceId: sv.id, dealId: sv.dealId, type: "续费", rec: "续" + sv.type, expireOn: sv.end, amount: 0, currency: "CAD", advisorId: sv.advisorId, status: "新机会", openedAt: TODAY, handled: false });
          added++;
        });
        auditIn(d, "导入", `模拟 T-90 跑批，新建 ${added} 条`);
      });
      toast.success(`模拟跑批完成：新建 ${added} 条（未结机会已跳过）`);
    },
    updateStudent(id, patch) {
      const st = studentById(id);
      if (!canWriteStudent(st)) { toast.error("只能改自己负责的学生档案"); return; }
      mutate((d) => {
        const x = d.students.find((y) => y.id === id);
        if (x) Object.assign(x, patch);
        auditIn(d, "修改", `改学生 ${st?.zhName}`);
      });
      toast.success("档案已保存");
    },
    addStudent(row) {
      if (user?.role === "finance") { toast.error("财务不能建档"); return; }
      if (!row.zhName || !row.enName || !row.mobile) { toast.error("中英名和手机必填"); return; }
      mutate((d) => {
        d.students.push({ id: "st" + Date.now(), fxId: "FX" + String(d.students.length + 1).padStart(4, "0"), advisorId: user!.id, status: "Active", source: "手工建档", grade: "", school: "", parentName: "", email: "", wechat: "", ...row } as Student);
        auditIn(d, "新增", `建档 ${row.zhName}`);
      });
      toast.success("已建档");
    },
    claimLead(id) {
      const ld = db.leads.find((x) => x.id === id);
      if (!ld || ld.followerId) { toast.error("已被领取"); return; }
      mutate((d) => {
        const x = d.leads.find((y) => y.id === id);
        if (x) { x.followerId = user!.id; x.status = "跟进中"; }
        d.students.push(buildStudentFromLead(d, ld, user!.id));
        auditIn(d, "新增", `领取线索并建档 ${ld.zhName}`);
      });
      toast.success("已建学生档案");
    },
    assignLead(id, advisorId) {
      if (user?.role !== "owner") { toast.error("仅老板可指派线索"); return; }
      const ld = db.leads.find((x) => x.id === id);
      if (!ld) return;
      mutate((d) => {
        const x = d.leads.find((y) => y.id === id);
        if (x) { x.followerId = advisorId; x.status = "跟进中"; }
        d.students.push(buildStudentFromLead(d, ld, advisorId));
        if (!ld.partnerId && ld.partnerName && !d.partners.some((p) => p.name === ld.partnerName)) {
          d.partners.push({ id: "p" + Date.now(), name: ld.partnerName, type: "个人", status: "active", contact: ld.contact, phone: ld.phone, email: ld.email });
        }
        auditIn(d, "新增", `指派线索 ${ld.zhName} → ${userById(advisorId)?.name}`);
      });
      toast.success("已建学生档案并指派");
    },
    ackReminder(key) {
      mutate((d) => {
        if (d.reminderAcks.some((a) => a.key === key && a.userId === user!.id)) return;
        d.reminderAcks.push({ key, userId: user!.id });
      });
    },
    issueToken(studentId) {
      const st = studentById(studentId);
      if (!canWriteStudent(st)) { toast.error("只能给自己学生发缴费链接"); return null; }
      const tok = "tok" + Date.now();
      mutate((d) => {
        d.payTokens.push({ id: tok, studentId, partnerId: st?.partnerId, expired: false });
        auditIn(d, "新增", `发缴费链接 ${st?.zhName}`);
      });
      return tok;
    },
    publicHour(row) {
      mutate((d) => { d.hours.unshift({ id: "h" + Date.now(), status: "已提交", initiator: "teacher", planned: 0, ...row } as HourEntry); });
      toast.success("已提交，可继续填下一节");
    },
    publicLead(row) {
      mutate((d) => { d.leads.unshift({ id: "ld" + Date.now(), followerId: "", status: "", ...row } as Lead); });
      toast.success("线索已提交");
    },
    publicPay(row) {
      const id = "pay" + Date.now();
      mutate((d) => {
        d.payments.unshift({ id, status: "已登记", createdAt: TODAY, filerType: "合作方", voucher: "upload.png", ...row } as Payment);
        d.commissions.unshift({ id: "c" + Date.now(), paymentId: id, filerType: "合作方", filerPartnerId: row.filerPartnerId, received: row.amount || 0, refund: 0, rate: 10, paidOut: 0 });
      });
      toast.success("已登记，等待财务确认");
    },
    addUser(row) {
      mutate((d) => {
        d.users.push({ id: "u" + Date.now(), status: "active", ...row } as User);
        auditIn(d, "权限变更", `新增账号 ${row.name}（${row.role}）`);
      });
      toast.success("账号已建");
    },
    handover(fromId, toId) {
      mutate((d) => {
        let n = 0;
        d.students.forEach((s) => { if (s.advisorId === fromId) { s.advisorId = toId; n++; } });
        d.tasks.forEach((t) => { if (t.assigneeId === fromId && t.status !== "已完成") t.assigneeId = toId; });
        d.services.forEach((s) => { if (s.advisorId === fromId) s.advisorId = toId; });
        d.opportunities.forEach((o) => { if (o.advisorId === fromId) o.advisorId = toId; });
        const u = d.users.find((x) => x.id === fromId);
        if (u) u.status = "inactive";
        auditIn(d, "权限变更", `离职交接 ${userById(fromId)?.name} → ${userById(toId)?.name}，${n} 名学生`);
      });
      toast.success("交接完成，原账号已停用");
    },
    addTeacher(row) {
      mutate((d) => { d.teachers.push({ id: "t" + Date.now(), status: "active", ...row } as Teacher); auditIn(d, "新增", `老师 ${row.zhName}`); });
    },
    toggleTeacher(id) {
      mutate((d) => {
        const t = d.teachers.find((x) => x.id === id);
        if (t) t.status = t.status === "active" ? "inactive" : "active";
        auditIn(d, "修改", `老师 ${t?.zhName} → ${t?.status}`);
      });
    },
    patchTeacher(id, patch) {
      mutate((d) => {
        const t = d.teachers.find((x) => x.id === id);
        if (!t) return;
        Object.assign(t, patch);
        auditIn(d, "修改", `老师 ${t.zhName}`);
      });
    },
    addPartner(row) {
      mutate((d) => { d.partners.push({ id: "p" + Date.now(), status: "active", ...row } as Partner); auditIn(d, "新增", `合作方 ${row.name}`); });
    },
    togglePartner(id) {
      mutate((d) => {
        const p = d.partners.find((x) => x.id === id);
        if (p) p.status = p.status === "active" ? "inactive" : "active";
        auditIn(d, "修改", `合作方 ${p?.name} → ${p?.status}`);
      });
    },
    patchPartner(id, patch) {
      mutate((d) => {
        const p = d.partners.find((x) => x.id === id);
        if (!p) return;
        Object.assign(p, patch);
        auditIn(d, "修改", `合作方 ${p.name}`);
      });
    },
    addEnum(group, val) {
      if (!val.trim()) return;
      mutate((d) => {
        if (!d.enums[group].includes(val)) d.enums[group].push(val);
        auditIn(d, "修改", `枚举 ${group} + ${val}`);
      });
      toast.success("已加入枚举");
    },
    fakeImport() {
      mutate((d) => auditIn(d, "导入", "Excel 导入演示：成功 2 条，跳过 0，待清洗 1"));
      toast.success("导入完成：成功 2 条，跳过 0 条，待清洗 1 条");
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
