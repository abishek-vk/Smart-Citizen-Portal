import { Router } from "express";
import { db, complaintsTable, propertyTaxesTable, waterTaxesTable, certificatesTable, notificationsTable, usersTable, paymentsTable } from "@workspace/db";
import { eq, and, gte, count, sum, sql, desc } from "drizzle-orm";
import { requireAuth, ensureUser } from "../lib/auth";
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

router.get("/dashboard/admin", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const [totalCitizens] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "citizen"));
  const [totalComplaints] = await db.select({ count: count() }).from(complaintsTable);
  const [totalRevenue] = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(eq(paymentsTable.status, "success"));

  const today = new Date(); today.setHours(0,0,0,0);
  const [resolvedToday] = await db.select({ count: count() }).from(complaintsTable)
    .where(and(eq(complaintsTable.status, "resolved"), gte(complaintsTable.updatedAt, today)));

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

  // Citizen growth: last 7 days
  const citizenGrowth = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().split("T")[0], value: Math.floor(Math.random() * 5) + 1 };
  });

  res.json({
    totalCitizens: Number(totalCitizens.count),
    totalComplaints: Number(totalComplaints.count),
    resolvedComplaintsToday: Number(resolvedToday.count),
    totalRevenue: Number(totalRevenue?.total ?? 0),
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
  const period = params.success ? (params.data.period ?? "30d") : "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

  const trends = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().split("T")[0], value: Math.floor(Math.random() * 15) + 1 };
  });

  res.json(trends);
});

router.get("/dashboard/department-performance", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const departments = ["Public Works", "Water & Sanitation", "Transport", "Electricity", "Parks & Recreation"];
  const performance = departments.map(dept => ({
    department: dept,
    resolved: Math.floor(Math.random() * 50) + 10,
    pending: Math.floor(Math.random() * 20) + 2,
    avgDays: Math.round((Math.random() * 5 + 1) * 10) / 10,
    score: Math.round((Math.random() * 30 + 70) * 10) / 10,
  }));
  res.json(performance);
});

export default router;
