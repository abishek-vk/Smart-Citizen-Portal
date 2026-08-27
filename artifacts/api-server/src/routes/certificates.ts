import { Router } from "express";
import { db, certificatesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth, ensureUser, requireAdmin } from "../lib/auth";
import {
  ListCertificatesQueryParams, ApplyCertificateBody,
  GetCertificateParams, UpdateCertificateParams, UpdateCertificateBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import type { IRouter } from "express";

const router: IRouter = Router();

router.get("/certificates", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const params = ListCertificatesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const conditions: any[] = [];
  if (!isAdmin) conditions.push(eq(certificatesTable.userId, user.id));
  if (params.success && params.data.type) conditions.push(eq(certificatesTable.type, params.data.type as any));
  if (params.success && params.data.status) conditions.push(eq(certificatesTable.status, params.data.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(certificatesTable).where(where);
  const data = await db.select().from(certificatesTable).where(where).orderBy(desc(certificatesTable.createdAt)).limit(limit).offset(offset);
  res.json({ data, pagination: { total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) } });
});
router.post("/certificates", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const body = { ...req.body };
  if (!body.subjectDateOfBirth) delete body.subjectDateOfBirth;
  if (!body.subjectDateOfDeath) delete body.subjectDateOfDeath;
  if (!body.remarks) delete body.remarks;

  const parsed = ApplyCertificateBody.safeParse(body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = (req as any).user;

  const insertData: any = {
    id: randomUUID(),
    userId: user.id,
    type: parsed.data.type,
    applicantName: parsed.data.applicantName,
    applicantRelation: parsed.data.applicantRelation,
    subjectName: parsed.data.subjectName,
    placeOfEvent: parsed.data.placeOfEvent,
    remarks: parsed.data.remarks || null,
    status: "pending",
    subjectDateOfBirth: parsed.data.subjectDateOfBirth ? new Date(parsed.data.subjectDateOfBirth).toISOString().split("T")[0] : null,
    subjectDateOfDeath: parsed.data.subjectDateOfDeath ? new Date(parsed.data.subjectDateOfDeath).toISOString().split("T")[0] : null,
  };

  const [cert] = await db.insert(certificatesTable).values(insertData).returning();
  res.status(201).json(cert);
});

router.get("/certificates/:id", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const user = (req as any).user;
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, params.data.id));
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && cert.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(cert);
});

router.patch("/certificates/:id", requireAuth, ensureUser, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateCertificateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: any = { ...parsed.data };
  if (parsed.data.status === "approved") updateData.approvedAt = new Date();
  const [updated] = await db.update(certificatesTable).set(updateData).where(eq(certificatesTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.get("/certificates/:id/download", requireAuth, ensureUser, async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).send("Invalid ID"); return; }
  const user = (req as any).user;
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, params.data.id));
  if (!cert) { res.status(404).send("Certificate not found"); return; }

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  if (!isAdmin && cert.userId !== user.id) { res.status(403).send("Forbidden"); return; }

  if (cert.status !== "approved") {
    res.status(400).send("Certificate is not approved yet.");
    return;
  }

  const title = cert.type === "birth" ? "OFFICIAL BIRTH CERTIFICATE" : "OFFICIAL DEATH CERTIFICATE";
  const certNo = cert.certificateNumber || `CERT-${cert.id.slice(0, 8).toUpperCase()}`;
  const eventDateStr = cert.subjectDateOfBirth || cert.subjectDateOfDeath || "N/A";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${certNo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .certificate-container { border-color: #1e3a8a !important; box-shadow: none !important; }
    }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      margin: 0;
    }
    .no-print {
      margin-bottom: 24px;
    }
    .print-btn {
      background-color: #1e3a8a;
      color: white;
      border: none;
      padding: 12px 28px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }
    .print-btn:hover {
      background-color: #1e40af;
    }
    .certificate-container {
      width: 800px;
      background: #ffffff;
      padding: 60px;
      border: 12px double #1e3a8a;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      position: relative;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header img, .header svg {
      width: 64px;
      height: 64px;
      margin-bottom: 12px;
    }
    .city-title {
      font-size: 18px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .dept-title {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .cert-title {
      font-size: 32px;
      color: #1e3a8a;
      margin-top: 16px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .cert-number {
      font-family: monospace;
      font-size: 14px;
      color: #475569;
      margin-top: 8px;
    }
    .body-content {
      line-height: 1.8;
      font-size: 18px;
      margin-bottom: 40px;
    }
    .cert-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .cert-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .cert-table td.label {
      font-weight: bold;
      color: #475569;
      width: 40%;
    }
    .cert-table td.value {
      color: #0f172a;
      font-size: 18px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 50px;
      pt-6;
    }
    .seal-box {
      text-align: center;
      border: 2px dashed #059669;
      padding: 16px 24px;
      border-radius: 8px;
      background: #ecfdf5;
      color: #047857;
    }
    .signature-box {
      text-align: center;
      border-top: 1px solid #94a3b8;
      width: 220px;
      padding-top: 8px;
      font-size: 14px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="certificate-container">
    <div class="header">
      <svg viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
      <div class="city-title">Smart City Municipal Corporation</div>
      <div class="dept-title">Department of Civil Registration & Public Records</div>
      <div class="cert-title">${title}</div>
      <div class="cert-number">Registration No: ${certNo}</div>
    </div>

    <div class="body-content">
      <p style="text-align: center; margin-bottom: 24px;">
        This is to officially certify that the following civil record has been verified and registered in accordance with the Smart City Municipal Regulations.
      </p>

      <table class="cert-table">
        <tr>
          <td class="label">Subject Full Name:</td>
          <td class="value"><strong>${cert.subjectName}</strong></td>
        </tr>
        <tr>
          <td class="label">${cert.type === "birth" ? "Date of Birth:" : "Date of Death:"}</td>
          <td class="value">${eventDateStr}</td>
        </tr>
        <tr>
          <td class="label">Place of Event:</td>
          <td class="value">${cert.placeOfEvent}</td>
        </tr>
        <tr>
          <td class="label">Applicant Name & Relation:</td>
          <td class="value">${cert.applicantName} (${cert.applicantRelation})</td>
        </tr>
        <tr>
          <td class="label">Registration Status:</td>
          <td class="value" style="color: #059669; font-weight: bold;">OFFICIALLY APPROVED</td>
        </tr>
        ${cert.approvedAt ? `<tr><td class="label">Approval Date:</td><td class="value">${new Date(cert.approvedAt).toLocaleDateString()}</td></tr>` : ''}
      </table>
    </div>

    <div class="footer">
      <div class="seal-box">
        <strong style="display: block; font-size: 16px;">OFFICIAL DIGITAL SEAL</strong>
        <span style="font-size: 12px;">Verified & Authenticated</span>
      </div>
      <div class="signature-box">
        <strong>Registrar of Civil Status</strong><br/>
        <span>Smart City Municipal Admin</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;
