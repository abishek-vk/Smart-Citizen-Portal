import { Router } from "express";
import { db, complaintsTable, propertyTaxesTable, waterTaxesTable, certificatesTable, notificationsTable, usersTable, paymentsTable, departmentsTable } from "@workspace/db";
import { eq, and, gte, count, sum, sql, desc } from "drizzle-orm";
import { requireAuth, ensureUser, requireAdmin } from "../lib/auth";
import { GetComplaintTrendsQueryParams } from "@workspace/api-zod";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/dashboard/citizen", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const [activeComplaints] = await db.select({ count: count() }).from(complaintsTable)
    .where(and(eq(complaintsTable.userId, user.id), sql`${complaintsTable.status} IN ('pending','in_progress')`));

  const [pendingCerts] = await db.select({ count: count() }).from(certificatesTable)
    .where(and(eq(certificatesTable.userId, user.id), sql`${certificatesTable.status} IN ('pending','under_review')`));

  const [ptaxDue] = await db.select({ total: sum(propertyTaxesTable.totalDue) }).from(propertyTaxesTable)
    .where(and(eq(propertyTaxesTable.userId, user.id), eq(propertyTaxesTable.status, "pending")));
  const [wtaxDue] = await db.select({ total: sum(waterTaxesTable.totalDue) }).from(waterTaxesTable)
    .where(and(eq(waterTaxesTable.userId, user.id), eq(waterTaxesTable.status, "pending")));

  const [unread] = await db.select({ count: count() }).from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));

  const recentComplaints = await db.select().from(complaintsTable)
    .where(eq(complaintsTable.userId, user.id))
    .orderBy(desc(complaintsTable.createdAt)).limit(5);

  const recentActivity = recentComplaints.map(c => ({
    id: c.id, type: "complaint", description: c.title,
    timestamp: c.createdAt.toISOString(), status: c.status
  }));

  const propertyDue = Number(ptaxDue?.total ?? 0);
  const waterDue = Number(wtaxDue?.total ?? 0);

  const ptaxBills = await db.select().from(propertyTaxesTable)
    .where(and(eq(propertyTaxesTable.userId, user.id), eq(propertyTaxesTable.status, "pending")))
    .limit(3);
  const wtaxBills = await db.select().from(waterTaxesTable)
    .where(and(eq(waterTaxesTable.userId, user.id), eq(waterTaxesTable.status, "pending")))
    .limit(3);

  const upcomingPayments = [
    ...ptaxBills.map(b => ({ id: b.id, type: "Property Tax", amount: b.totalDue, dueDate: b.dueDate, status: b.status })),
    ...wtaxBills.map(b => ({ id: b.id, type: "Water Tax", amount: b.totalDue, dueDate: b.dueDate, status: b.status })),
  ];

  const resolvedCount = await db.select({ count: count() }).from(complaintsTable)
    .where(and(eq(complaintsTable.userId, user.id), eq(complaintsTable.status, "resolved")));
  const totalComplaints = Number(activeComplaints.count) + Number(resolvedCount[0]?.count ?? 0);
  const resolutionRate = totalComplaints > 0 ? (Number(resolvedCount[0]?.count ?? 0) / totalComplaints) * 100 : 0;

  res.json({
    activeComplaints: Number(activeComplaints.count),
    pendingCertificates: Number(pendingCerts.count),
    totalTaxDue: propertyDue + waterDue,
    unreadNotifications: Number(unread.count),
    recentComplaints: recentComplaints.map(c => ({ ...c, user })),
    upcomingPayments,
    recentActivity,
    quickStats: {
      complaintResolutionRate: Math.round(resolutionRate),
      avgResolutionDays: 3.5,
      taxComplianceRate: 85,
    }
  });
});

router.get("/dashboard/admin", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const [totalCitizens] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "citizen"));
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const [todayRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable)
    .where(and(eq(paymentsTable.status, "success"), gte(paymentsTable.paidAt, today)));
  const [resolvedToday] = await db.select({ count: count() }).from(complaintsTable)
    .where(and(eq(complaintsTable.status, "resolved"), gte(complaintsTable.resolvedAt, today)));
  const [activeComplaints] = await db.select({ count: count() }).from(complaintsTable)
    .where(sql`${complaintsTable.status} IN ('pending', 'in_progress')`);

  const [pendingCerts] = await db.select({ count: count() }).from(certificatesTable).where(eq(certificatesTable.status, "pending"));

  const complaintsByStatus = [
    { status: "pending", count: 0 }, { status: "in_progress", count: 0 },
    { status: "resolved", count: 0 }, { status: "closed", count: 0 }
  ];
  for (const item of complaintsByStatus) {
    const [r] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, item.status as any));
    item.count = Number(r?.count ?? 0);
  }

  const categories = ["electricity","water","roads","garbage","transport","street_lights","drainage","public_safety","environment","other"];
  const complaintsByCategory = await Promise.all(categories.map(async cat => {
    const [r] = await db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.category, cat as any));
    return { category: cat, count: Number(r?.count ?? 0) };
  }));

  const [ptaxRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "property_tax"), eq(paymentsTable.status, "success")));
  const [wtaxRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "water_tax"), eq(paymentsTable.status, "success")));
  const [parkingRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(and(eq(paymentsTable.type, "parking"), eq(paymentsTable.status, "success")));

  const revenueByType = [
    { type: "Property Tax", amount: Number(ptaxRevenue?.total ?? 0) },
    { type: "Water Tax", amount: Number(wtaxRevenue?.total ?? 0) },
    { type: "Parking", amount: Number(parkingRevenue?.total ?? 0) },
  ];

  const recentActivity = (await db.select().from(complaintsTable).orderBy(desc(complaintsTable.updatedAt)).limit(10))
    .map(c => ({ id: c.id, type: "complaint", description: c.title, timestamp: c.updatedAt.toISOString(), status: c.status }));

  const growthStart = new Date();
  growthStart.setUTCHours(0, 0, 0, 0);
  growthStart.setUTCDate(growthStart.getUTCDate() - 29);
  const registrationDay = sql<string>`to_char(${usersTable.createdAt}::date, 'YYYY-MM-DD')`;
  const registrations = await db.select({
    date: registrationDay,
    value: count(),
  }).from(usersTable)
    .where(and(eq(usersTable.role, "citizen"), gte(usersTable.createdAt, growthStart)))
    .groupBy(registrationDay);
  const registrationCounts = new Map(registrations.map(row => [row.date, Number(row.value)]));
  const citizenGrowth = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(growthStart);
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().split("T")[0];
    return { date, value: registrationCounts.get(date) ?? 0 };
  });

  res.json({
    totalCitizens: Number(totalCitizens.count),
    totalComplaints: Number(activeComplaints.count),
    resolvedComplaintsToday: Number(resolvedToday.count),
    totalRevenue: Number(todayRevenue?.total ?? 0),
    pendingCertificates: Number(pendingCerts.count),
    complaintsByStatus,
    complaintsByCategory,
    revenueByType,
    recentActivity,
    citizenGrowth,
  });
});

router.get("/dashboard/complaint-trends", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetComplaintTrendsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const period = params.data.period ?? "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const complaintDay = sql<string>`to_char(${complaintsTable.createdAt}::date, 'YYYY-MM-DD')`;
  const rows = await db.select({ date: complaintDay, value: count() })
    .from(complaintsTable)
    .where(gte(complaintsTable.createdAt, start))
    .groupBy(complaintDay);
  const countsByDay = new Map(rows.map(row => [row.date, Number(row.value)]));
  const trends = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().split("T")[0];
    return { date, value: countsByDay.get(date) ?? 0 };
  });

  res.json(trends);
});

router.get("/dashboard/department-performance", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable).where(eq(departmentsTable.isActive, true));
  const performance = await Promise.all(departments.map(async department => {
    const departmentComplaints = await db.select({
      status: complaintsTable.status,
      createdAt: complaintsTable.createdAt,
      resolvedAt: complaintsTable.resolvedAt,
    }).from(complaintsTable).where(eq(complaintsTable.departmentId, department.id));
    const resolved = departmentComplaints.filter(complaint => complaint.status === "resolved");
    const pending = departmentComplaints.filter(complaint =>
      complaint.status === "pending" || complaint.status === "in_progress");
    const resolvedDurations = resolved
      .filter(complaint => complaint.resolvedAt)
      .map(complaint => (complaint.resolvedAt!.getTime() - complaint.createdAt.getTime()) / 86_400_000);
    const total = resolved.length + pending.length;

    return {
      department: department.name,
      resolved: resolved.length,
      pending: pending.length,
      avgDays: resolvedDurations.length
        ? Math.round(resolvedDurations.reduce((sum, days) => sum + days, 0) / resolvedDurations.length * 10) / 10
        : 0,
      score: total ? Math.round(resolved.length / total * 1000) / 10 : 0,
    };
  }));
  res.json(performance);
});

export default router;
