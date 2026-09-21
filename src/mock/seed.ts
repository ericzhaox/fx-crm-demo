import type { Db } from "@/api/types";

export const TODAY = "2026-09-21";
export const TOMORROW = "2026-09-22";

export const seed: Db = {
  users: [
    { id: "adv1", name: "陈顾问", email: "advisor@demo", role: "advisor", supervisorId: "owner1", status: "active" },
    { id: "adv2", name: "王顾问", email: "wang@demo", role: "advisor", status: "active" },
    { id: "owner1", name: "高老板", email: "owner@demo", role: "owner", status: "active" },
    { id: "fin1", name: "李财务", email: "finance@demo", role: "finance", status: "active" },
  ],
  teachers: [
    { id: "t1", zhName: "刘老师", enName: "Liu Wei", status: "active", phone: "13800002001" },
    { id: "t2", zhName: "周老师", enName: "Zhou Min", status: "active", phone: "13800002002" },
    { id: "t3", zhName: "停用老师", enName: "Inactive", status: "inactive" },
  ],
  partners: [
    { id: "p1", name: "枫叶教育", type: "单位", status: "active", contact: "王经理", phone: "13900001111", email: "maple@demo.com" },
    { id: "p2", name: "林先生", type: "个人", status: "active", contact: "林先生", phone: "13900003333", email: "lin@demo.com" },
    { id: "p3", name: "旧渠道", type: "单位", status: "inactive" },
  ],
  enums: {
    dealTypes: ["监护", "转学", "After-school", "学分课", "大学申请", "活动", "夏令营", "私校申请", "签证", "其他"],
    taskTypes: ["学校沟通", "续费", "服务交付", "家长沟通", "学习跟进"],
  },
  students: [
    { id: "st1", fxId: "FX0001", zhName: "张小雨", enName: "Emily Zhang", grade: "G11", school: "Westside Secondary", parentName: "张伟", mobile: "13800001001", email: "emily.zhang@demo.edu", wechat: "emily_wx", advisorId: "adv1", status: "Active", source: "转介绍", partnerId: "p1", firstDealDate: "2025-09-01", offerExpires: "2026-11-02", visaExpires: "2026-10-21" },
    { id: "st2", fxId: "FX0002", zhName: "李明轩", enName: "Leo Li", grade: "G10", school: "Oakridge", parentName: "李娜", mobile: "13800001002", email: "leo.li@demo.edu", wechat: "", advisorId: "adv1", status: "Active", source: "合作方", partnerId: "p2", firstDealDate: "2026-03-12", offerExpires: "2027-06-01", visaExpires: "2027-08-15" },
    { id: "st3", fxId: "FX0003", zhName: "王思琪", enName: "Sophie Wang", grade: "G12", school: "St. George's", parentName: "王强", mobile: "13800001003", email: "sophie.w@demo.edu", wechat: "sophie_wx", advisorId: "adv2", status: "Active", source: "自然到访", firstDealDate: "2024-11-20", offerExpires: "2026-10-09", visaExpires: "2026-12-01" },
    { id: "st4", fxId: "FX0004", zhName: "周子墨", enName: "Max Zhou", grade: "G9", school: "Burnaby North", parentName: "周敏", mobile: "13800001004", email: "max.z@demo.edu", wechat: "", advisorId: "adv2", status: "Alumni", source: "合作方", partnerId: "p1", firstDealDate: "2023-09-01" },
    { id: "st5", fxId: "FX0005", zhName: "吴晓萱", enName: "Hannah Wu", grade: "G10", school: "Point Grey", parentName: "吴刚", mobile: "13800001005", email: "hannah.wu@demo.edu", wechat: "", advisorId: "adv1", status: "Active", source: "手工建档" },
    { id: "st6", fxId: "FX0006", zhName: "郑浩然", enName: "Ryan Zheng", grade: "G11", school: "Magee", parentName: "郑丽", mobile: "13800001006", email: "ryan.z@demo.edu", wechat: "", advisorId: "adv2", status: "Active", source: "转介绍" },
    { id: "st7", fxId: "FX0007", zhName: "林诗涵", enName: "Stella Lin", grade: "G9", school: "University Hill", parentName: "林峰", mobile: "13800001007", email: "stella.lin@demo.edu", wechat: "", advisorId: "adv1", status: "Active", source: "合作方", partnerId: "p2" },
    { id: "st8", fxId: "FX0008", zhName: "黄子轩", enName: "Jay Huang", grade: "G12", school: "Kitsilano", parentName: "黄伟", mobile: "13800001008", email: "jay.h@demo.edu", wechat: "", advisorId: "adv2", status: "Active", source: "自然到访" },
    { id: "st9", fxId: "FX0009", zhName: "赵一诺", enName: "Eva Zhao", grade: "G10", school: "Churchill", parentName: "赵敏", mobile: "13800001009", email: "eva.zhao@demo.edu", wechat: "", advisorId: "adv1", status: "Active", source: "手工建档" },
    { id: "st10", fxId: "FX0010", zhName: "孙启明", enName: "Kevin Sun", grade: "G8", school: "David Thompson", parentName: "孙杰", mobile: "13800001010", email: "kevin.sun@demo.edu", wechat: "", advisorId: "adv2", status: "Active", source: "合作方", partnerId: "p1" },
    { id: "st11", fxId: "FX0011", zhName: "马思远", enName: "Sarah Ma", grade: "G11", school: "Eric Hamber", parentName: "马丽", mobile: "13800001011", email: "sarah.ma@demo.edu", wechat: "", advisorId: "adv1", status: "Active", source: "转介绍" },
    { id: "st12", fxId: "FX0012", zhName: "何俊杰", enName: "Jason He", grade: "G9", school: "Windermere", parentName: "何军", mobile: "13800001012", email: "jason.he@demo.edu", wechat: "", advisorId: "adv2", status: "Active", source: "手工建档" },
  ],
  services: [
    { id: "sv1", studentId: "st1", dealId: "d3", name: "学分课 · 数学", type: "学分课", advisorId: "adv1", teacherId: "t1", start: "2026-01-10", end: "2026-12-20", totalHours: 40, completedHours: 32, status: "进行中" },
    { id: "sv2", studentId: "st1", dealId: "d3", name: "大学申请文书", type: "大学申请", advisorId: "adv1", teacherId: "t2", start: "2026-09-01", end: "2026-12-31", totalHours: 12, completedHours: 12, status: "进行中" },
    { id: "sv3", studentId: "st2", dealId: "d2", name: "After-school", type: "After-school", advisorId: "adv1", teacherId: "t1", start: "2026-02-01", end: "2026-11-30", totalHours: 60, completedHours: 18, status: "进行中" },
    { id: "sv4", studentId: "st3", name: "签证辅导", type: "签证", advisorId: "adv2", teacherId: "t2", start: "2026-08-01", end: "2026-10-30", totalHours: 8, completedHours: 3, status: "进行中" },
  ],
  deals: [
    { id: "d1", studentId: "st3", name: "大学申请", type: "大学申请", amount: 18000, currency: "CNY", ownerId: "adv2", status: "潜在" },
    { id: "d2", studentId: "st1", name: "学分课续报", type: "学分课", amount: 12800, currency: "CNY", ownerId: "adv1", status: "跟进", partnerId: "p1" },
    { id: "d3", studentId: "st2", name: "After-school", type: "After-school", amount: 2400, currency: "CAD", ownerId: "adv1", status: "成交", partnerId: "p2", closedAt: "2026-03-12" },
    { id: "d4", studentId: "st3", name: "签证", type: "签证", amount: 4500, currency: "CAD", ownerId: "adv2", status: "跟进" },
    { id: "d5", studentId: "st1", name: "无服务成交样例", type: "活动", amount: 3000, currency: "CNY", ownerId: "adv1", status: "成交", closedAt: "2026-08-01" },
    { id: "d6", studentId: "st2", name: "夏令营", type: "夏令营", amount: 5200, currency: "CAD", ownerId: "adv1", status: "潜在" },
    { id: "d7", studentId: "st1", name: "监护", type: "监护", amount: 8000, currency: "CAD", ownerId: "adv1", status: "成交", closedAt: "2026-09-01" },
  ],
  hours: [
    { id: "h1", title: "张小雨 数学 请假", teacherId: "t1", studentId: "st1", serviceId: "sv1", subject: "数学", attendance: "请假", date: "2026-09-17", start: "16:00", hours: 2, planned: 0, summary: "家长临时接走。", performance: 3, homeworkNote: "本节请假，下周补听写。", status: "已提交", initiator: "teacher" },
    { id: "h2", title: "李明轩 After-school", teacherId: "t1", studentId: "st2", serviceId: "sv3", subject: "托管", attendance: "正常", date: "2026-09-18", start: "15:30", hours: 2, planned: 2, summary: "作业辅导。", performance: 5, attachmentName: "worksheet.pdf", homeworkNote: "完成数学练习第 3–5 题。", status: "已通过", initiator: "teacher" },
    { id: "h3", title: "王思琪 签证课", teacherId: "t2", studentId: "st3", serviceId: "sv4", subject: "签证", attendance: "正常", date: "2026-09-16", start: "10:00", hours: 1, planned: 1, summary: "材料清单。", performance: 4, status: "已通过", initiator: "teacher" },
    { id: "h4", title: "李明轩 数学补课", teacherId: "t1", studentId: "st2", serviceId: "sv3", subject: "数学", attendance: "正常", date: "2026-09-19", start: "17:00", hours: 1.5, planned: 1.5, summary: "补课跟进函数图像。", performance: 4, status: "已提交", initiator: "advisor" },
  ],
  payments: [
    { id: "pay1", studentId: "st1", dealId: "d2", filerType: "顾问", filerUserId: "adv1", amount: 9000, currency: "CNY", voucher: "receipt-paid.jpg", status: "已付款", createdAt: "2026-09-10" },
    { id: "pay2", studentId: "st2", dealId: "d3", filerType: "合作方", filerPartnerId: "p2", amount: 2400, currency: "CAD", voucher: "e-transfer.png", status: "待确认", createdAt: "2026-09-18" },
    { id: "pay3", studentId: "st1", dealId: "d5", filerType: "顾问", filerUserId: "adv1", amount: 12800, currency: "CNY", voucher: "wx-0918.png", status: "已登记", createdAt: "2026-09-19" },
    { id: "pay4", studentId: "st3", dealId: "d4", filerType: "顾问", filerUserId: "adv2", amount: 6800, currency: "CNY", voucher: "bank.pdf", status: "未付款", createdAt: "2026-09-12" },
    { id: "pay5", studentId: "st1", filerType: "合作方", filerPartnerId: "p1", amount: 3000, currency: "CNY", voucher: "wrong.png", note: "金额不符", status: "退回", createdAt: "2026-09-08" },
  ],
  commissions: [
    { id: "c1", paymentId: "pay1", filerType: "顾问", filerUserId: "adv1", received: 9000, refund: 0, rate: 10, paidOut: 200 },
    { id: "c2", paymentId: "pay2", filerType: "合作方", filerPartnerId: "p2", received: 2400, refund: 0, rate: 15, paidOut: 0 },
    { id: "c3", paymentId: "pay3", filerType: "顾问", filerUserId: "adv1", received: 12800, refund: 500, rate: 10, paidOut: 0 },
    { id: "c4", paymentId: "pay4", filerType: "顾问", filerUserId: "adv2", received: 6800, refund: 0, rate: 8, paidOut: 0 },
  ],
  tasks: [
    { id: "tk1", title: "联系家长补材料", studentId: "st1", assigneeId: "adv1", deadline: TODAY, priority: "高", status: "待开始", type: "家长沟通", note: "缺监护公证" },
    { id: "tk2", title: "跟 Guidance 沟通", studentId: "st1", assigneeId: "adv1", deadline: TOMORROW, priority: "中", status: "待开始", type: "学校沟通" },
    { id: "tk3", title: "检查数学成绩", studentId: "st3", assigneeId: "adv2", deadline: TODAY, priority: "中", status: "待开始", type: "学习跟进" },
    { id: "tk4", title: "夏令营报名确认", studentId: "st2", assigneeId: "adv1", deadline: "2026-09-25", priority: "低", status: "进行中", type: "服务交付" },
  ],
  opportunities: [
    { id: "op1", studentId: "st1", serviceId: "sv1", dealId: "d2", type: "续费", rec: "续学分课", expireOn: "2026-12-20", amount: 12800, currency: "CNY", advisorId: "adv1", status: "新机会", openedAt: "2026-09-21", handled: false },
    { id: "op2", studentId: "st3", type: "二销", rec: "大学申请套餐", expireOn: "2026-11-15", amount: 18000, currency: "CNY", advisorId: "adv2", status: "跟进", openedAt: "2026-08-01", handled: false, escalated: true },
  ],
  leads: [
    { id: "ld1", zhName: "陈可", enName: "Chen Ke", startOn: "2026-10-01", partnerName: "枫叶教育", partnerId: "p1", contact: "王经理", phone: "13900001111", email: "maple@demo.com", grade: "G10", school: "待定", parent: "陈芳", parentPhone: "13900001112", wechat: "chenke_wx", intent: "监护", followerId: "", status: "" },
    { id: "ld2", zhName: "刘一诺", enName: "Liu Yinuo", startOn: "2027-02-01", partnerName: "新渠道·张女士", contact: "张女士", phone: "13900002222", grade: "G8", intent: "私校申请", followerId: "", status: "" },
  ],
  audits: [
    { id: "a1", type: "登录", actorId: "adv1", at: "2026-09-21 09:01", content: "陈顾问登录", result: "成功" },
    { id: "a2", type: "审核", actorId: "adv1", at: "2026-09-18 18:02", content: "通过课时 h2 拟计入 2", result: "成功" },
    { id: "a3", type: "修改", actorId: "fin1", at: "2026-09-18 10:12", content: "收费 pay1 → 已付款", result: "成功" },
  ],
  payTokens: [{ id: "tok1", studentId: "st1", partnerId: "p1", expired: false }],
  reminderAcks: [],
};
